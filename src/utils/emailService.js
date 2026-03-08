import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
export const initEmailjs = () => {
    emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
};

export const sendRegistrationEmail = async (userEmail, userName, eventName) => {
    try {
        const templateParams = {
            to_email: userEmail,
            to_name: userName,
            event_name: eventName,
            message: `You have successfully registered for the event: ${eventName}. We look forward to seeing you there!`
        };

        const response = await emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_REGISTRATION_TEMPLATE_ID, // Ensure we use the right template ID!
            templateParams
        );
        console.log('Registration email sent successfully', response.status, response.text);
        return response;
    } catch (error) {
        console.error('Failed to send registration email', error);
        throw error;
    }
};

export const sendResourceEmail = async (userEmail, userName, eventName, resourceName) => {
    try {
        const templateParams = {
            to_email: userEmail,
            to_name: userName,
            event_name: eventName,
            message: `A new resource "${resourceName}" has been uploaded for the event: ${eventName}.`
        };

        const response = await emailjs.send(
            import.meta.env.VITE_EMAILJS_SERVICE_ID,
            import.meta.env.VITE_EMAILJS_RESOURCE_TEMPLATE_ID, // Ensure we use the right template ID!
            templateParams
        );
        console.log('Resource email sent successfully', response.status, response.text);
        return response;
    } catch (error) {
        console.error('Failed to send resource email', error);
        throw error;
    }
};
