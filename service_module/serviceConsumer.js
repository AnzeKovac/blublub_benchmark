
import {Element, api} from 'fmwrk';
import init from 'asyncPageReferenceGenerator';
import {Service} from './service';

export default class ServiceConsumer extends Element {
    @api itemId;
    service;

    connectedCallback() {
        this.service = new Service(this);
        this.service.controllLoading = true;
        this.generateRedirect();
    }

    async generateRedirect() {
        try {
            let redirectReference = (await this.service.apex(init, {itemId: this.itemId})).redirectReference;
            if(redirectReference){
                redirectReference.attributes = redirectReference.referenceAttributes;
                this[NavigationMixin.Navigate](redirectReference, true)
            }
        } catch (e) {
            this.service.showToast('',e,'error');
        }
    }
}