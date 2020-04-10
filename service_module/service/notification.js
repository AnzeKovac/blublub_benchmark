import {SendEvent} from "platformSendEvent";

class Notification {
    toast(context, title, message, variant) {
        const evt = new SendEvent({
            title: title,
            message: message,
            variant: variant
        });
        context.dispatchEvent(evt);
    }
}

export {Notification}