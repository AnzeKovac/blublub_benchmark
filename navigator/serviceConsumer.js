
import {Element, api, track} from 'fmwrk';
import init from 'asyncPageReferenceGenerator';
import {Service} from './service';

export default class ServiceConsumer extends Element {
    @track loader = false;
    @api recordId;
    service;

    connectedCallback() {
        this.service = new Service(this);
        this.service.controllSpinner = true;
        this.navigateToRelatedRecord();
    }

    async navigateToRelatedRecord() {
        try {
            let pageReference = (await this.service.apex(init, {recordId: this.recordId})).pageReference;
            if(pageReference){
                pageReference.attributes = pageReference.referenceAttributes;
                this[NavigationMixin.Navigate](pageReference, true)
            }
        } catch (e) {
            this.service.showToast('',e,'error');
        }
    }
}