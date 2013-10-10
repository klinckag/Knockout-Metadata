(function (factory) {
    // Module systems magic dance.

    //if (typeof require === "function" && typeof exports === "object" && typeof module === "object") {
    //    // CommonJS or Node: hard-coded dependency on "knockout"
    //    factory(require("knockout"), exports);
    //} else if (typeof define === "function" && define["amd"]) {
    //    // AMD anonymous module with hard-coded dependency on "knockout"
    //    define(["knockout", "exports"], factory);
    //} else {
    //    // <script> tag: use the global `ko` object, attaching a `mapping` property
    //    factory(ko, ko.metadata = {});
    //}
    factory(ko, Globalize, ko.metadata = {});
}(function (ko, Globalize, exports) {
    if (typeof (ko) === undefined) {
        throw 'Knockout is required, please ensure it is loaded before loading this knockout-metadata plug-in';
    }
    if (typeof (Globalize) === undefined) {
        throw 'Globalize is required, please ensure it is loaded before loading this knockout-metadata plug-in';
    }

    var metadata = exports;
    ko.metadata = metadata;

    //#region ViewModelBase:..
    //BaseViewModel which ViewModels should extend.
    //   It provides basic functionality for validation and metadata
    var vmb = (function () {
        var ViewModelBase = function (metadata) {
            var self = this;

            //Validation specific stuff goes on the _validationContainer function.
            self._validationContainer = function () { };
            self._validationContainer.displayValidation = ko.observable(true);
            self._validationContainer.validationTargets = [];
            self._validationContainer.requiredFields = ko.observableArray();
            self._validationContainer.validationMessages = ko.observableArray();
            self._validationContainer.removeValidationMessagesForField = function (fieldName) {
                self._validationContainer.validationMessages.remove(function (item) {
                    return item.fieldName === fieldName;
                });
            };

            //Metadata specific stuff goes on the _metadataContainer function.
            self._metadataContainer = function () { };
            self._metadataContainer.data = metadata;

            //Get the metadata for a specific property.
            //   'Nested' objects are supported through the . notation ( fi address.street )
            self.getMetadata = function (propertyName) {
                var parts = propertyName.split(".");
                return ko.metadata.getMetadata(self._metadataContainer.data, parts);
            };

            // Iterate through the validationTargets of all the observables with validation rules and check validity.
            self.isValid = function () {
                var isvalid = true;
                var i = 0;
                while (i < self._validationContainer.validationTargets.length) {
                    if (!self._validationContainer.validationTargets[i].validate()) {
                        isvalid = false;
                    }
                    i += 1;
                }
                return isvalid;
            };

            // Create an observable with all validation related stuff attached.
            self.createObservable = function (fieldName, initialValue) {
                return ko.metadata.createObservable(self, fieldName, initialValue);
            };

            self.createDateFormatter = function (observable, format) {
                return ko.metadata.createDateFormatter(self, observable, format);
            }
        };

        return {
            ViewModelBase: ViewModelBase
        }
    }());
    // Expose
    ko.utils.extend(metadata, vmb);
    //#endregion ViewModelBase:..

    //#region API:..
    var api = (function () {

        createObservable = function (viewmodel, fieldName, initialValue) {
            if (initialValue === undefined) {
                initialValue = null;
            }
            //Initialize the validation system
            var observable = ko.observable(initialValue).extend({ metadata: viewmodel._validationContainer });

            var metadata = viewmodel.getMetadata(fieldName);
            observable.fieldName = fieldName;
            observable.displayName = metadata.DisplayName;

            //observable.extend({ validateInRequiredFields: { fieldName: fieldName, requiredFields: viewmodel._validation.requiredFields } });

            //if (metadata && metadata.DataType) {
            //    if (metadata.DataType === "Int32") {
            //        observable.extend({ validateInt32: true });
            //    }
            //    if (metadata.DataType === "Decimal") {
            //        observable.extend({ validateFloat: true });
            //    }
            //    if (metadata.DataType === "Date") {
            //        observable.extend({ validateDate: true });
            //    }
            //    if (metadata.DataType === "EmailAddress") {
            //        observable.extend({ validateEmail: "Invalid email" });
            //    }
            //}
            //for (i = 0; i < metadata.ValidationRules.length; i++) {
            //    var rule = metadata.ValidationRules[i];
            //    if (rule.Name === "length" && rule.Params.max) {
            //        observable.extend({ validateMaxLength: rule.Params.max });
            //    }
            //    if (rule.Name === "length" && rule.Params.min) {
            //        observable.extend({ validateMinLength: rule.Params.min });
            //    }
            //    if (rule.Name === "required") {
            //        viewmodel._validation.requiredFields.push(fieldName);
            //    }
            //}

            return observable;
        };

        createIntegerFormatter = function (observable) {
            return createNumericFormatter(observable, "n0", false);
        }

        createDecimalFormatter = function (observable, numberOfDecimalPlaces) {
            return createNumericFormatter(observable, "n" + numberOfDecimalPlaces, true);
        }

        createNumericFormatter = function (observable, format, allowDecimals) {
            //create a writeable computed observable to intercept writes to our observable
            format = format || "n";

            var result = ko.computed({
                read: function () {
                    var formatted = Globalize.format(observable(), format);
                    return formatted;
                },
                write: function (newValue) {
                    var current = observable();
                    var formattedCurrent = Globalize.format(observable(), format);
                    var parsedValue = newValue;
                    var valueToWrite = newValue;
                    if (newValue != undefined) {
                        if (typeof newValue !== "number") {
                            if (allowDecimals) {
                                parsedValue = Globalize.parseFloat(newValue);
                            }
                            else {
                                parsedValue = Globalize.parseInt(newValue);
                                var parsedFloat = Globalize.parseFloat(newValue);
                                if (parsedValue != parsedFloat) {
                                    parsedValue = null;
                                }
                            }
                        }
                    }
                    if (parsedValue) {
                        valueToWrite = parsedValue;
                    }
                    if (valueToWrite === "") {
                        valueToWrite = null;
                    }

                    if (valueToWrite !== current) {
                        observable(valueToWrite);
                    }
                    if (formattedCurrent !== newValue) {
                        observable.notifySubscribers(valueToWrite);
                    }
                }
            })

            return result;
        };

        createDateFormatter = function (viewModel, observable, format) {
            //create a writeable computed observable to intercept writes to our observable
            var formats;
            if (!format) {
                var propMetadata = viewModel.getMetadata(observable.fieldName);
                if (propMetadata.DataType === "Date") {
                    format = Globalize.expandFormat("d");
                    formats = [0];
                    formats[0] = format;
                }
                if (propMetadata.DataType === "DateTime") {
                    formats = [1];
                    formats[0] = Globalize.expandFormat("d");
                    formats[0] = formats[0] + " ";
                    formats[0] = formats[0] + Globalize.expandFormat("t");

                    formats[1] = Globalize.expandFormat("d");
                    formats[1] = formats[1] + " ";
                    formats[1] = formats[1] + Globalize.expandFormat("T");

                    format = formats[0]
                }
            }

            format = format || "d";

            var result = ko.computed({
                read: function () {
                    var formatted = Globalize.format(observable(), format);
                    return formatted;
                },
                write: function (newValue) {
                    var current = observable();
                    var formattedCurrent = Globalize.format(observable(), format);
                    var parsedValue = newValue;
                    var valueToWrite = newValue;
                    if (newValue != undefined) {
                        if (!(newValue instanceof Date)) {
                            parsedValue = Globalize.parseDate(newValue, formats);
                        }
                    }
                    if (parsedValue) {
                        //compensate timezoneoffset
                        //parsedValue.setUTCMinutes(parsedValue.getMinutes() - parsedValue.getTimezoneOffset());
                        valueToWrite = parsedValue;
                    }

                    if (valueToWrite !== current) {
                        observable(valueToWrite);
                    }
                    if (formattedCurrent !== newValue) {
                        observable.notifySubscribers(valueToWrite);
                    }
                }
            })

            return result;
        };

        getMetadata = function (viewModel, propertyNames) {
            var propertyNameToGet = propertyNames.shift();
            var match = ko.utils.arrayFirst(viewModel.Properties, function (item) {
                return item.PropertyName === propertyNameToGet;
            });

            if (propertyNames.length !== 0) {
                return getMetadata(match, propertyNames)
            }

            return match;
        };

        mapToViewModelByMetadata = function (data, viewmodel) {
            var metadata = viewmodel._metadataContainer.data;
            mapToViewModelByMetadataInternal(data, viewmodel, metadata);
        }

        mapToViewModelByMetadataInternal = function (data, viewmodel, metadata) {
            //Loop metadata for all the Properties of the entity
            for (var i = 0; i < metadata.Properties.length; i++) {
                var propMetadata = metadata.Properties[i];
                var dataValue = null;
                if (data[propMetadata.PropertyName]) {
                    dataValue = data[propMetadata.PropertyName]
                }
                if (propMetadata.IsComplexType) {
                    if (propMetadata.IsListType) {
                        for (var j=0; j < dataValue.length; j++) {
                            var listItem = dataValue[j];
                            //Convention => 'create' function is used to create and map an item in a nested list
                            var vm = viewmodel[propMetadata.PropertyName].create(propMetadata.ListTypeViewModelMetadata);
                            mapToViewModelByMetadataInternal(listItem, vm, propMetadata.ListTypeViewModelMetadata);
                            viewmodel[propMetadata.PropertyName].push(vm);
                        }
                    }
                    else {
                        //TODO : should use a convention based 'create' function ?
                        mapToViewModelByMetadataInternal(dataValue, viewmodel[propMetadata.PropertyName](), propMetadata);
                    }
                }
                else {
                    if (viewmodel[propMetadata.PropertyName] === undefined) {
                        //Create the observable
                        viewmodel[propMetadata.PropertyName] = viewmodel.createObservable(propMetadata.PropertyName);
                    }
                    //And set the value
                    //special case for Dates
                    if (propMetadata.DataType === "Date" || propMetadata.DataType === "DateTime") {
                        dataValue = Globalize.parseDate(dataValue, "yyyy-MM-ddTHH:mm:ss");
                        //compensate timezoneoffset
                        //value.setUTCMinutes(value.getMinutes() - value.getTimezoneOffset());
                    }
                    viewmodel[propMetadata.PropertyName](dataValue)
                }
            }
        }

        return {
            //formatMessage: formatMessage,
            //registerExtenders: registerExtenders,
            createObservable: createObservable,
            //validateObservable: validateObservable,
            createIntegerFormatter: createIntegerFormatter,
            createDecimalFormatter: createDecimalFormatter,
            createDateFormatter: createDateFormatter,
            //formatJSON: formatJSON,
            getMetadata: getMetadata,
            mapToViewModelByMetadata: mapToViewModelByMetadata
            //isObservableArray: isObservableArray
        };

    }());
    // expose api publicly
    ko.utils.extend(metadata, api);

    //Enables the metadata framework for the given observable
    //This one should be called before other 'metadata' extenders
    ko.extenders.metadata = function (observable, modelValidationContainer) {
        observable.validationMessages = ko.observableArray();
        observable.isValid = ko.computed(function () {
            return observable.validationMessages().length === 0;
        });
        observable.isValidForUi = ko.computed(function () {
            var isValid = observable.isValid();
            var displayValidation = modelValidationContainer.displayValidation();
            if (displayValidation) {
                return isValid;
            }
            return true;
        });
        observable.validationMessage = ko.computed(function () {
            return observable.validationMessages().join("\r\n");
        });

        // array of all rules for the given observable
        observable.validationRules = [];

        // check the observable against all attached validators
        observable.validate = function () {
            //TODO enable ....
            //ko.metadata.validateObservable(observable, modelValidationContainer);
        };

        // validate when it changes
        observable.subscribe(observable.validate);

        // push valid checking function to the model
        modelValidationContainer.validationTargets.push(observable);

        return observable;
    };

    ko.bindingHandlers.errorBinding = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var accessor = valueAccessor();
            ko.renderTemplate('kov_fieldValidationIndicator', { data: valueAccessor() }, {}, element, 'replaceNode');
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            // This will be called once when the binding is first applied to an element,
            // and again whenever the associated observable changes value.
            // Update the DOM element based on the supplied values here.
        }
    };

    ko.bindingHandlers.labelBinding = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var accessor = valueAccessor();
            ko.renderTemplate('kov_label', { data: valueAccessor() }, {}, element, 'replaceNode');
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            // This will be called once when the binding is first applied to an element,
            // and again whenever the associated observable changes value.
            // Update the DOM element based on the supplied values here.
        }
    };

    // Templates used to render the grid
    var templateEngine = new ko.nativeTemplateEngine();

    templateEngine.addTemplate = function (templateName, templateMarkup) {
        document.write("<script type='text/html' id='" + templateName + "'>" + templateMarkup + "<" + "/script>");
    };

    templateEngine.addTemplate("kov_fieldValidationIndicator", "<span class=\"kov_fieldValidationIndicator\" data-bind=\"visible: !data.isValidForUi(), attr: {title: data.validationMessage}\">&nbsp;!&nbsp;</span>");
    templateEngine.addTemplate("kov_label", "<label data-bind=\"attr: { for: data.fieldName }, text: data.displayName + ' : '\"></label>")
}));