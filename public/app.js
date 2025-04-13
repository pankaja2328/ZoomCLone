// Firebase config
const firebaseConfig = {
  apiKey: "YourAPI",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "545326282672",
  appId: ""
};//change this using your firebase

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Global refs
let localStream, remoteStreams = {};
let peerConnections = {}; // Store peer connections for all users
const servers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' }
  ]
};

const localVideo = document.getElementById('localVideo');
const messagesDiv = document.getElementById('messages');

// Global variable to track the current user's ID
let currentUserId = null;

// Start the camera
async function startCamera() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
  } catch (error) {
    console.error('Error starting camera:', error);
    alert('Failed to access camera and microphone. Please check your permissions.');
  }
}

// Ensure the camera is started before creating or joining a room
async function ensureCameraStarted() {
  if (!localStream) {
    alert('Please start the camera before creating or joining a room.');
    await startCamera();
  }
  if (!localStream) {
    throw new Error('Failed to start the camera. Please check your permissions and try again.');
  }
}

// Initialize peerConnection for a specific user
function initializePeerConnection(userId, roomId) {
  if (!localStream) {
    throw new Error('Local stream is not initialized. Please start the camera first.');
  }

  const peerConnection = new RTCPeerConnection(servers);

  // Add local stream tracks to the peer connection
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  // Handle remote stream: add track instead of relying solely on event.streams
  peerConnection.ontrack = event => {
    if (!remoteStreams[userId]) {
      remoteStreams[userId] = new MediaStream();
    }
    // Add the track from the event
    remoteStreams[userId].addTrack(event.track);

    // Create or get the video element for the remote stream
    let remoteVideo = document.getElementById(`remoteVideo-${userId}`);
    if (!remoteVideo) {
      remoteVideo = document.createElement('video');
      remoteVideo.id = `remoteVideo-${userId}`;
      remoteVideo.autoplay = true;
      remoteVideo.playsInline = true;
      // Append to the 'remoteVideos' container instead of document.body
      document.getElementById('remoteVideos').appendChild(remoteVideo);
    }
    remoteVideo.srcObject = remoteStreams[userId];
  };

  // Handle ICE candidates
  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      const candidatesCollection = db.collection('calls').doc(roomId).collection('candidates').doc(userId);
      candidatesCollection.add(event.candidate.toJSON());
    }
  };

  peerConnections[userId] = peerConnection;
  return peerConnection;
}

// Create a new room
async function createRoom() {
  try {
    await ensureCameraStarted(); // Ensure the camera is started

    const callDoc = db.collection('calls').doc();
    currentUserId = callDoc.id; // Use callDoc.id as the sender for creator

    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    document.getElementById('roomIdInput').value = callDoc.id;

    const peerConnection = initializePeerConnection(callDoc.id, callDoc.id);

    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        offerCandidates.add(event.candidate.toJSON());
      }
    };

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    const roomWithOffer = {
      offer: {
        type: offer.type,
        sdp: offer.sdp
      }
    };
    await callDoc.set(roomWithOffer);

    callDoc.onSnapshot(snapshot => {
      const data = snapshot.data();
      if (!peerConnection.currentRemoteDescription && data?.answer) {
        peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });
    listenForMessages(callDoc.id);

    answerCandidates.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const candidate = new RTCIceCandidate(change.doc.data());
          peerConnection.addIceCandidate(candidate);
        }
      });
    });

    alert('Room created! Share the Room ID with others to join.');
  } catch (error) {
    console.error('Error creating room:', error);
    alert('Failed to create room. Check the console for details.');
  }
}

// Join an existing room
async function joinRoom() {
  try {
    await ensureCameraStarted(); // Ensure the camera is started

    const roomId = document.getElementById('roomIdInput').value.trim();
    if (!roomId) {
      alert('Please enter a valid Room ID.');
      return;
    }

    // Create a unique user ID for the joining peer
    const userId = 'user-' + Math.floor(Math.random() * 10000);
    currentUserId = userId; // Set global currentUserId

    const callDoc = db.collection('calls').doc(roomId);
    const offerCandidates = callDoc.collection('offerCandidates');
    const answerCandidates = callDoc.collection('answerCandidates');

    // Initialize peer connection using the unique userId
    const peerConnection = initializePeerConnection(userId, roomId);

    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        answerCandidates.add(event.candidate.toJSON());
      }
    };

    const callData = (await callDoc.get()).data();
    if (!callData) {
      alert('Room not found. Please check the Room ID.');
      return;
    }

    await peerConnection.setRemoteDescription(new RTCSessionDescription(callData.offer));

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    const roomWithAnswer = {
      answer: {
        type: answer.type,
        sdp: answer.sdp
      }
    };
    await callDoc.update(roomWithAnswer);

    offerCandidates.onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });

    listenForMessages(roomId);

    alert('Successfully joined the room!');
  } catch (error) {
    console.error('Error joining room:', error);
    alert('Failed to join the room. Check the console for details.');
  }
}

// Send a message with sender info
async function sendMessage() {
  const roomId = document.getElementById('roomIdInput').value.trim();
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();

  if (!roomId || !message) {
    alert('Please enter a valid Room ID and message.');
    return;
  }

  const messagesCollection = db.collection('calls').doc(roomId).collection('messages');
  await messagesCollection.add({
    text: message,
    sender: currentUserId,  // Save sender id along with the message
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  messageInput.value = ''; // Clear the input field
}

// Listen for new messages and differentiate between sent and received
function listenForMessages(roomId) {
  const messagesCollection = db.collection('calls').doc(roomId).collection('messages');
  messagesCollection.orderBy('timestamp').onSnapshot(snapshot => {
    console.log('Snapshot Triggered');
    const messagesDiv = document.getElementById('messages');
    messagesDiv.innerHTML = ''; // Clear previous messages

    snapshot.forEach(doc => {
      const message = doc.data();
      const messageElement = document.createElement('div');
      messageElement.classList.add('message-box', 'chat-message');
      
      // Add class based on sender id
      if (message.sender === currentUserId) {
        messageElement.classList.add('sent');
      } else {
        messageElement.classList.add('received');
      }
      
      messageElement.textContent = message.text;
      messagesDiv.appendChild(messageElement);
    });

    // Scroll to the bottom after adding new messages
    scrollToBottom();
  });
}

// Scroll the chat to the bottom
function scrollToBottom() {
  const messagesDiv = document.getElementById('messages');
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Toggle mute/unmute for local audio tracks
function toggleMute() {
  if (!localStream) {
    alert('Start the camera first.');
    return;
  }

  // Toggle each audio track's enabled state
  localStream.getAudioTracks().forEach(track => {
    track.enabled = !track.enabled;
  });

  // Optionally, update the UI to reflect the new state
  const muteButton = document.querySelector('button[onclick="toggleMute()"]');
  if (localStream.getAudioTracks()[0].enabled) {
    muteButton.textContent = 'Mute';
  } else {
    muteButton.textContent = 'Unmute';
  }
}

// Cleanup peerConnections on page unload
window.addEventListener('beforeunload', () => {
  Object.values(peerConnections).forEach(pc => pc.close());
});
