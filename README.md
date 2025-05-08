# Secure String Sharing Application

This is a simple Node.js application that allows users to securely share private strings/text that are only accessible with a password.

## Features

- Create and share secret strings/text with password protection
- AES-256-GCM encryption for maximum security
- Simple and intuitive user interface
- Copy functionality for easy sharing
- Responsive design that works on mobile and desktop

## Installation

1. Clone this repository or download the files
2. Make sure you have Node.js installed (v12.0.0 or higher recommended)
3. Open a terminal in the project directory
4. Install dependencies:

```
npm install
```

5. Create a `public` folder in the root directory
6. Move the HTML files (`index.html` and `view.html`) to the `public` folder

## Usage

1. Start the application:

```
npm start
```

2. Open your browser and navigate to `http://localhost:3000`
3. Enter your secret string/text and a password
4. Share the generated link with others
5. Recipients will need the password to access the content

## Security Notes

- This application uses AES-256-GCM encryption with salting and key derivation
- All encryption/decryption happens on the server
- In a production environment, consider:
  - Adding HTTPS
  - Using a proper database instead of in-memory storage
  - Implementing rate limiting
  - Adding string expiration functionality

## Project Structure

- `app.js` - Main application file with all the server-side logic
- `public/index.html` - Homepage for creating secure strings
- `public/view.html` - Page for viewing secure strings with a password
- `package.json` - Node.js project configuration

## License

MIT