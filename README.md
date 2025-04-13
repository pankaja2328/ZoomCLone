# Zoom Clone

Zoom Clone is a video conferencing and chat application built using WebRTC and Firebase Firestore. It enables users to create rooms, join existing rooms, view video streams, and chat in real time. This application is designed with a modern, responsive UI and comes with basic audio control features.

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Setup and Installation](#setup-and-installation)
- [Usage](#usage)
- [Firebase Configuration](#firebase-configuration)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Video Conferencing:**  
  Real-time video and audio using WebRTC.
  
- **Real-Time Chat:**  
  Chat functionality is powered by Firebase Firestore with messages differentiated between sent and received.
  
- **Room Management:**  
  Create or join rooms using a unique Room ID.
  
- **Audio Control:**  
  Mute and unmute local audio with an easy-to-use toggle.

- **Responsive Design:**  
  Adaptable layout that works on both desktop and mobile devices.

## Project Structure

```
ZoomCLone/
├── .firebaserc                # Firebase project configuration
├── .gitignore                 # Git ignore rules for node, firebase, etc.
├── firebase.json              # Firebase hosting configuration (public folder)
└── public/
    ├── 404.html               # Custom 404 error page
    ├── app.js                 # Main JavaScript file (WebRTC, Firebase, Chat, Mute, etc.)
    ├── index.html             # Main HTML file for the application UI
    └── style.css              # Styling for the application UI
```

- **[index.html](./public/index.html)**  
  Contains the structure for video streams, control buttons (create/join room, mute/unmute), and the chat section.

- **[app.js](./public/app.js)**  
  Handles the application logic including:  
  - Firebase initialization  
  - Starting media (camera and microphone)  
  - Room creation and joining  
  - Managing peer connections for video calls  
  - Real-time chat functionality via Firestore  
  - Mute/Unmute functionality for audio tracks

- **[style.css](./public/style.css)**  
  Contains the styling for the overall layout including video container, buttons, chat section, and responsiveness.

- **[404.html](./public/404.html)**  
  A custom 404 error page generated for Firebase hosting.

- **firebase.json**  
  Configures Firebase Hosting with `public` as the hosting folder.

- **.firebaserc**  
  Contains Firebase project settings for deployment.

- **.gitignore**  
  Specifies files and directories to ignore in the repository.

## Setup and Installation

1. **Clone the Repository:**

   ```bash
   git clone <repository-url>
   cd ZoomCLone
   ```

2. **Install Dependencies (if any):**  
   This project uses plain HTML, CSS, and JavaScript with Firebase SDKs loaded from a CDN, so no additional dependency installations are required.

3. **Configure Firebase:**

   - Create a [Firebase](https://firebase.google.com/) project.
   - Replace the Firebase configuration in [app.js](./public/app.js) with your project's configuration.
   - Update your Firebase rules if necessary to allow read/write access for testing.

4. **Serve the Application Locally:**

   You can use a simple HTTP server. For example, using [http-server](https://www.npmjs.com/package/http-server):

   ```bash
   npm install -g http-server
   http-server -c-1
   ```

   Then open your browser and navigate to [http://localhost:8080](http://localhost:8080).

5. **Deploying with Firebase Hosting (Optional):**

   If you have the Firebase CLI installed, deploy your application using:

   ```bash
   firebase deploy
   ```

## Usage

1. **Start the Camera:**  
   Click the **Start Camera** button to enable your local video and audio.

2. **Create a Room:**  
   Click **Create Room** to generate a new room. The Room ID will be auto-filled in the input field—share this ID with other users.

3. **Join a Room:**  
   Enter the Room ID and click **Join Room** to connect to an existing room.

4. **Mute/Unmute Audio:**  
   Use the **Mute/Unmute** button to toggle your microphone during the call.

5. **Chat:**  
   Use the chat section to send messages. Messages are differentiated by sender (your messages appear with a unique styling).

## Firebase Configuration

The project uses Firebase to handle:
  
- **Firestore:** Tracks chat messages and signaling data for WebRTC.
- **Firebase Hosting:** Serves static files (configured in [firebase.json](./firebase.json)).

Make sure to adjust Firebase rules and configurations corresponding to your project’s requirements.

## Contributing

Contributions are welcome! Feel free to fork the repository, make enhancements, and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the [MIT License](LICENSE).

---

Happy Coding!