const crypto = require('crypto');

class Encryption {
    static encryptString(text, password) {
        const salt = crypto.randomBytes(16);
        const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

        let encrypted = cipher.update(text, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const authTag = cipher.getAuthTag().toString('hex');

        return {
            salt: salt.toString('hex'),
            iv: iv.toString('hex'),
            encrypted,
            authTag
        };
    }

    static decryptString(encryptedData, password) {
        try {
            const salt = Buffer.from(encryptedData.salt, 'hex');
            const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
            const iv = Buffer.from(encryptedData.iv, 'hex');
            const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
            decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

            let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        } catch (error) {
            return null;
        }
    }
}

module.exports = Encryption;