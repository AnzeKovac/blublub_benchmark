class Navigation{
    getPageReference(pageReference){
        if(pageReference){
            if(pageReference.referenceAttributes || pageReference.referenceState){
                return {
                    type: pageReference.type,
                    attributes: pageReference.referenceAttributes,
                    state: pageReference.referenceState
                }
            }
        }
        return pageReference;
    }
}

export {Navigation}