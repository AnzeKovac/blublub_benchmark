import {Notification} from "./notification";
import {Navigation} from "./navigation";
import {Caller} from "./caller";

class Service {
    constructor(context) {
        this.controllSpinner = false;
        this.context = context;
    }

    apex(method, params) {
        let apexCallout = new Caller(this.controllSpinner);
        return apexCallout.execute(this.context, method, params);
    }

    showToast(title, message, type) {
        new Notification().toast(this.context, title, message, type);
    }

    getPageReference(pageReference){
        return new Navigation().getPageReference(pageReference);
    }
}

export {Service}