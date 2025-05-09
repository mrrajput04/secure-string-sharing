# Secure String Sharing Application

This is a simple Node.js application that allows users to securely share private strings/text that are only accessible with a password.

## Features

- Create and share secret strings/text with password protection
- AES-256-GCM encryption for maximum security
- String expiration options (1 hour, 24 hours, 3 days, 7 days, 30 days)
- Rate limiting to prevent brute-force attacks
- QR code generation for easy mobile sharing
- Customizable QR code (color, background, size)
- Multiple theme options (Light, Dark, Ocean, Forest)
- Simple and intuitive user interface
- Copy functionality for easy sharing
- Social sharing options (Twitter, Facebook, LinkedIn)
- Responsive design that works on mobile and desktop
- Markdown editor with preview support

## Favicon and Web Manifest

The application includes a favicon and a web manifest for enhanced user experience on mobile devices. The favicon is available in multiple sizes to support different devices, and the web manifest provides metadata for the application.

- **Favicon**: Located in the `public/favicon` directory, the favicon is available in various sizes including 192x192 and 512x512 pixels.
- **Web Manifest**: The `site.webmanifest` file in the `public/favicon` directory contains the following properties:
  - `name`: "Secure File Sharing"
  - `short_name`: "SecureShare"
  - `icons`: Array of icon objects with `src`, `sizes`, and `type` attributes.
  - `theme_color`: "#3498db"
  - `background_color`: "#ffffff"
  - `display`: "standalone"

## Installation

1. Clone this repository or download the files
2. Make sure you have Node.js installed (v12.0.0 or higher recommended)
3. Open a terminal in the project directory
4. Install dependencies:

```bash
npm install
```

5. Create a `public` folder in the root directory
6. Move the HTML files (`index.html` and `view.html`) to the `public` folder

## Dependencies

- express - Web server framework
- body-parser - Request parsing middleware
- qrcode - QR code generation
- crypto (built-in) - Cryptographic functionality

## Usage

1. Start the application:

```
npm start
```

- Open your browser and navigate to http://localhost:3000
- Enter your secret string/text and a password
- Customize your QR code settings (optional)
- Choose your preferred theme (Light, Dark, Ocean, Forest)
- Share the generated link with others
- Recipients will need the password to access the content

## Security Notes

- This application uses AES-256-GCM encryption with salting and key derivation
- All encryption/decryption happens on the server
- Rate limiting prevents brute force password attacks (5 attempts per 15 min window)
- String expiration automatically removes old data
- In a production environment, consider:
  - Adding HTTPS
  - Using a proper database instead of in-memory storage
  - Adding additional monitoring and alerting
  - Secure HTTP headers using Helmet

## Project Structure

- `app.js` - Main application file with all the server-side logic
- `public/index.html` - Homepage for creating secure strings
- `public/view.html` - Page for viewing secure strings with a password
- `public/css/themes.css` - Theme styles and configurations
- `public/js/editor.js` - Markdown editor implementation
- `package.json` - Node.js project configuration

## License

MIT