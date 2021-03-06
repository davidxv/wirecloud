/*
 *     (C) Copyright 2012 Universidad Politécnica de Madrid
 *
 *     This file is part of Wirecloud Platform.
 *
 *     Wirecloud Platform is free software: you can redistribute it and/or
 *     modify it under the terms of the GNU Affero General Public License as
 *     published by the Free Software Foundation, either version 3 of the
 *     License, or (at your option) any later version.
 *
 *     Wirecloud is distributed in the hope that it will be useful, but WITHOUT
 *     ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 *     FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public
 *     License for more details.
 *
 *     You should have received a copy of the GNU Affero General Public License
 *     along with Wirecloud Platform.  If not, see
 *     <http://www.gnu.org/licenses/>.
 *
 */

/*global Wirecloud*/

(function () {

    "use strict";

    /*************************************************************************
     * Constructor TODO
     *************************************************************************/
/*     {'type': 'formAction', 'mainMsg': "Complete the form ", 'form': windowForm, 'actionElements': [newName, newUrl], 'actionMsgs': ["chose a new name for the Catalogue.", "Complete the url. for example: 'https://wirecloud.conwet.fi.upm.es'"], 'endElement': acceptButton, 'asynchronous': true},*/
    var FormAction = function FormAction(tutorial, options) {

        this.options = options;
        // Normalize asynchronous option
        this.options.asynchronous = !!this.options.asynchronous;
        this.layer = tutorial.msgLayer;
        this.last = false;
        this.tutorial = tutorial;
        this.mainTitle = options.mainTitle;
        this.mainMsg = options.mainMsg;
        this.mainPos = options.mainPos;
        this.actionElements = options.actionElements;
        this.actionElementsPos = options.actionElementsPos;
        this.actionElementsValidators = options.actionElementsValidators;
        this.actionMsgs = options.actionMsgs;
        this.disableElems = options.disableElems;
        this.endElement = options.endElement;
        this.endElementMsg = options.endElementMsg;
        this.endElementPos = options.endElementPos;
        this.form = options.form;
        this.mainPos = options.mainPos;
        this.subSteps = [];
        this.disableLayer = [];
        this.invalidcounter = 0;

        if (!Array.isArray(this.disableElems)) {
            this.disableElems = [];
        }

        if (this.mainMsg) {
            this.mainStep = new Wirecloud.ui.Tutorial.SimpleDescription(tutorial, {'type': 'simpleDescription', 'title': gettext(this.mainTitle), 'msg': gettext(this.mainMsg), 'elem': null});
            this.mainStep.setLast();
        }
    };

    /**
     * set this SimpleDescription as the last one, don't need next button. TODO
     */
    FormAction.prototype.setLast = function setLast() {
        this.last = true;
    };

    /**
     * set next handler
     */
    FormAction.prototype.setNext = function setNext() {
        this.nextHandler = nextHandler.bind(this);
    };

    /**
     * Next handler
     */
    var nextHandler = function nextHandler() {
        this.tutorial.nextStep();
    };

    var _activate = function _activate(form) {
        var pos, i, tempElem, warningIco;
        
        this.element = form;

        if (this.mainStep) {
            //main description
            this.mainStep.wrapperElement.addClassName("activeStep");

            // Positions
            pos = form.getBoundingClientRect();
            switch(this.mainPos) {
                case('up'):
                    this.mainStep.wrapperElement.style.top = (pos.top - this.mainStep.wrapperElement.getHeight() - 20) + 'px';
                    break;
                case('right'):
                    this.mainStep.wrapperElement.style.left = (pos.right + 20) + 'px';
                    break;
                case('left'):
                    this.mainStep.wrapperElement.style.left = (pos.left - this.mainStep.wrapperElement.getWidth() - 20) + 'px';
                    break;
                case('down'):
                    this.mainStep.wrapperElement.style.top = (pos.bottom + 20) + 'px';
                    break;
                default:
                    break;
            }
        }
        //main action for next step
        this.endAction = new Wirecloud.ui.Tutorial.UserAction(this.tutorial, {'type': 'userAction', 'msg': this.endElementMsg, 'elem': form.acceptButton.wrapperElement, 'pos': this.endElementPos});

        this.endAction.setNext();
        var withoutCloseButton = true;
        this.endAction.activate(withoutCloseButton);

        // substeps in this form action
        var activateSubFormAction = function (index, e) {
            this.subSteps[index].wrapperElement.addClassName('activate');
            validateInput.call(this, index);
        };
        var deActivateSubFormAction = function (index, e) {
            this.subSteps[index].wrapperElement.removeClassName('activate');
        };

        // validate function
        var validateInput = function(index, e) {
            if (!this.actionElementsValidators[index](this.actionElements[index]()) && !this.subSteps[index].wrapperElement.hasClassName('invalid')) {
                this.subSteps[index].wrapperElement.addClassName('invalid');
                this.form.acceptButton.disable();
                this.invalidcounter ++;
            } else if (this.actionElementsValidators[index](this.actionElements[index]()) && this.subSteps[index].wrapperElement.hasClassName('invalid')) {
                this.subSteps[index].wrapperElement.removeClassName('invalid');
                this.invalidcounter --;
                if (this.invalidcounter == 0) {
                    this.form.acceptButton.enable();
                }
            }
        }

        for (i = 0; i < this.actionElements.length; i ++) {
            this.subSteps[i] = new Wirecloud.ui.Tutorial.PopUp(this.actionElements[i](), {
                highlight: false,
                msg: this.actionMsgs[i],
                position: this.actionElementsPos[i],
                closable: false
            });

            this.layer.appendChild(this.subSteps[i].wrapperElement);
            this.subSteps[i].wrapperElement.addClassName('subFormAction');
            this.subSteps[i].repaint();

            // Handlers
            tempElem = this.actionElements[i]();
            tempElem.addEventListener('keyup', validateInput.bind(this, i), true);
            tempElem.addEventListener('focus', activateSubFormAction.bind(this, i), true);
            tempElem.addEventListener('blur', deActivateSubFormAction.bind(this, i), true);
        }
        if (this.actionElements != null) {
            // Activate first step
            activateSubFormAction.call(this,0);
        }
        for (i = 0; i < this.disableElems.length; i ++) {
            this.disableLayer[i] = this.disable(this.disableElems[i]());
        }
        form.cancelButton.disable();
        this.tutorial.resetControlLayer();
        this.tutorial.deactivateLayer();
    };

    /**
     * activate this step
     */
    FormAction.prototype.activate = function activate() {
        if (this.options.asynchronous) {
            this.form(_activate.bind(this));
        } else {
            _activate.call(this, this.form());
        }
    };

    /**
     * disable html element
     */
    FormAction.prototype.disable = function disable(elem) {
        var pos, disableLayer;

        pos = elem.getBoundingClientRect();
        disableLayer = document.createElement("div");
        disableLayer.addClassName('disableLayer');
        disableLayer.style.top = pos.top + 'px';
        disableLayer.style.left = pos.left + 'px';
        disableLayer.style.width = pos.width + 'px';
        disableLayer.style.height = pos.height + 'px';
        this.layer.appendChild(disableLayer);
        return disableLayer;     
    };

    /**
     * Destroy
     */
    FormAction.prototype.destroy = function destroy() {
        var i;

        for (i = 0; i < this.disableLayer.length; i ++) {
            this.layer.removeChild(this.disableLayer[i]);
        }
        for (i = 0; i < this.subSteps.length; i++) {
            this.subSteps[i].destroy();
        }

        if (this.mainStep != null) {
            this.mainStep.destroy();
            this.mainStep = null;
        }
        if (this.endAction != null) {
        	this.endAction.destroy();
            this.endAction = null;
        }
    };

    /*************************************************************************
     * Make Anchor public
     *************************************************************************/
    Wirecloud.ui.Tutorial.FormAction = FormAction;
})();
