// Knockout-Metadata library v0.1.0
// Author:      Geert Klinckaert (https://github.com/klinckag/Knockout-Metadata)
// License:     MIT (http://www.opensource.org/licenses/mit-license.php)


//Based on Knockout-Validation (https://github.com/Knockout-Contrib/Knockout-Validation)
//Author:		Eric M. Barnard - @ericmbarnard								
//License:		MIT (http://opensource.org/licenses/mit-license.php)		

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
    //    factory(ko, Globalize, ko.metadata = {});
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

    var defaults = {
        //useMetadataErrorMessage: true => uses the ErrorMessage specified by the metaData, false => uses the ErrorMessage specified by knockout.metadata.
        useMetadataErrorMessage: true,
        //decorateElement: true => adds the css class specified by 'errorElementClass' to the element when invalid.
        decorateElement: true,
        //errorsAsTitle: true => sets the title of the element to the validationmessage when invalid.
        errorsAsTitle: true,
        //errorElementClass: the css class for marking invalid elements 
        errorElementClass: 'input-validation-error'
    };

    var configuration = ko.utils.extend({}, defaults);
    ko.metadata.configuration = configuration;

    //#region ViewModelBase:..
    //BaseViewModel which ViewModels should extend.
    //   It provides basic functionality for validation and metadata
    var vmb = (function () {
        var ViewModelBase = function (metadata) {
            var self = this;

            //Validation specific stuff goes on the _validationContainer function.
            self._validationContainer = function () { };
            self._validationContainer.displayValidation = ko.observable(true);
            self._validationContainer.validationTargets = ko.observableArray([]);
            self._validationContainer.requiredFields = ko.observableArray();
            self._validationContainer.validationMessages = ko.computed(function () {
                var i = 0;
                var messages = [];
                for (i; i < self._validationContainer.validationTargets().length; i++) {
                    var observable = self._validationContainer.validationTargets()[i];
                    var j = 0;
                    for (j; j < observable.validationMessages().length; j++) {
                        messages.push({ fieldName: observable.fieldName, message: observable.validationMessages()[j] });
                    }
                }
                return messages;
            });
            self._validationContainer.removeValidationMessagesForField = function (fieldName) {
                self._validationContainer.validationMessages.remove(function (item) {
                    return item.fieldName === fieldName;
                });
            };

            //Metadata specific stuff goes on the _metadataContainer function.
            self._metadataContainer = function () { };
            self._metadataContainer.data = metadata;

            //Formatted stuff goes on the formatted function
            self._formatted = function () { };

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
        };

        return {
            ViewModelBase: ViewModelBase
        };
    }());

    // Expose
    ko.utils.extend(metadata, vmb);
    //#endregion ViewModelBase:..

    var utils = (function () {
        return {
            isEmptyVal: function (val) {
                if (val === undefined) {
                    return true;
                }
                if (val === null) {
                    return true;
                }
                if (val === "") {
                    return true;
                }
            },
            trim: function (val) {
                return val.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
            },
            hasAttribute: function (node, attr) {
                return node.getAttribute(attr) !== null;
            },
            getAttribute: function (element, attr) {
                return element.getAttribute(attr);
            },
            getOriginalElementTitle: function (element) {
                var savedOriginalTitle = utils.getAttribute(element, 'data-orig-title'),
                    currentTitle = element.title,
                    hasSavedOriginalTitle = utils.hasAttribute(element, 'data-orig-title');


                return hasSavedOriginalTitle ?
                    savedOriginalTitle : currentTitle;
            }
        };
    }());

    //#region API:..
    var api = (function () {
        formatMessage = function (message, fieldname, rule, params) {
            if (typeof (message) === 'function') {
                return message(params);
            }
            var m = message.replace(/\{0\}/gi, fieldname);

            var a = [];
            if (typeof (rule.messageArguments) === 'function') {
                a = rule.messageArguments(params)
            }

            m = m.replace(/{(\d+)}/g, function (match, number) {
                return typeof a[number - 1] != 'undefined' ? a[number - 1] : match;
            });

            return m;
        };

        createObservable = function (viewmodel, fieldName, initialValue) {
            var extenderInfo;

            if (initialValue === undefined) {
                initialValue = null;
            }
            //Initialize the knockout metadata validation system on the observable
            var observable = ko.observable(initialValue).extend({
                metadataValidation: {
                    viewModel: viewmodel,
                    fieldName: fieldName
                }
            });

            //Required fields are a special case ... every observable validates it when its field in in the requiredFields of the validationContainer
            //  Doing so we can easily add or remove required fields without having to add/remove rules on the observables themselves
            observable.extend({
                validateInRequiredFields: {
                    fieldName: fieldName,
                    requiredFields: viewmodel._validationContainer.requiredFields
                }
            });

            var metadata = viewmodel.getMetadata(fieldName);

            //Validation based on the datatype from the metadata
            extenderInfo = createDataTypeBasedExtender(metadata);
            if (extenderInfo) {
                observable.extend(extenderInfo.extender);
            }

            //Validation based on the validationRules from the metadata
            for (i = 0; i < metadata.validationRules.length; i++) {
                var metaDataValidationRule = metadata.validationRules[i];
                var validationRule = exports.validationRules[metaDataValidationRule.name];

                //required is a special case ... see above ...
                if (metaDataValidationRule.name === "required") {
                    viewmodel._validationContainer.requiredFields.push(fieldName);
                }

                extenderInfo = createValidationRuleExtender(viewmodel, metaDataValidationRule, validationRule);

                if (extenderInfo) {
                    if (configuration.useMetadataErrorMessage && rule.errorMessage && rule.errorMessage !== '') {
                        extenderInfo.extenderParams.message = rule.errorMessage;
                    }
                    if (validationRule && validationRule.ruleAdding) {
                        //TODO : Does this belong here ?? ( its the only place where we still have access to the viewmodel we are processing)
                        validationRule.ruleAdding(observable, viewmodel, extenderInfo.extenderParams);
                    };

                    observable.extend(extenderInfo.extender);
                }
            }

            return observable;
        };

        createDataTypeBasedExtender = function (metadata) {
            var extender;

            if (metadata && metadata.dataType) {
                switch (metadata.dataType) {
                    case "Byte":
                    case "SByte":
                    case "Int16":
                    case "UInt16":
                    case "Int32":
                    case "UInt32":
                    case "Int64":
                    case "UInt64":
                        extenderParams = {};
                        extender = { validateNumberIsWhole: extenderParams };
                        break;
                    case "Single":
                    case "Double":
                    case "Decimal":
                        extenderParams = {};
                        extender = { validateNumber: extenderParams };
                        break;
                    case "Date":
                        extender = { validateDate: true };
                        break;
                    case "EmailAddress":
                        extenderParams = {};
                        extender = { validateEmail: extenderParams };
                        break;
                }
            }

            return {
                extender: extender,
                extenderParams: extenderParams
            };
        };

        createValidationRuleExtender = function (viewmodel, metaDataValidationRule, validationRule) {
            var extenderParams, extender;

            if (metaDataValidationRule.name === 'length' && metaDataValidationRule.params.max) {
                extenderParams = { max: metaDataValidationRule.params.max };
                extender = { validateMaxLength: extenderParams };
            }
            if (metaDataValidationRule.name === 'length' && metaDataValidationRule.params.min) {
                extenderParams = { min: metaDataValidationRule.params.min };
                extender = { validateMinLength: extenderParams };
            }
            if (metaDataValidationRule.name === 'range') {
                extenderParams = { min: metaDataValidationRule.params.min, max: metaDataValidationRule.params.max };
                extender = { range: extenderParams };
            }
            if (metaDataValidationRule.name === 'equal') {
                extenderParams = { other: viewmodel[metaDataValidationRule.params.other]  };
                extender = { equal: extenderParams };
            }

            return {
                extender: extender,
                extenderParams: extenderParams
            };
        }

        createIntegerFormatter = function (observable) {
            return createNumericFormatter(observable, "n0", false);
        };

        createDecimalFormatter = function (observable, numberOfDecimalPlaces) {
            return createNumericFormatter(observable, "n" + numberOfDecimalPlaces, true);
        };

        createNumericFormatter = function (observable, format, allowDecimals) {
            //create a writeable computed observable to intercept writes to our observable
            format = format || "n";

            var result = ko.computed({
                read: function () {
                    var formatted = Globalize.format(observable(), format);
                    return formatted;
                },
                write: function (newValue) {
                    var currentValue = observable();
                    var parseResult = parseAndFormatNumeric(currentValue, newValue, format, allowDecimals);

                    if (parseResult.parsedValue !== currentValue) {
                        observable(parseResult.parsedValue);
                    }
                    if (parseResult.formattedValue !== parseResult.parsedValue) {
                        observable.notifySubscribers(parseResult.parsedValue);
                    }
                }
            });

            result.unFormattedObservable = ko.computed(function () {
                return observable;
            });

            return result;
        };

        createDateFormatter = function (observable, acceptedFormats, format) {
            //create a writeable computed observable to intercept writes to our observable
            if (format === undefined || format === null) {
                format = acceptedFormats[0];
            }

            format = format || "d";

            var result = ko.computed({
                read: function () {
                    var formatted = Globalize.format(observable(), format);
                    return formatted;
                },
                write: function (newValue) {
                    var currentValue = observable();
                    var parseResult = parseAndFormatDateTime(currentValue, newValue, format, acceptedFormats);

                    if (parseResult.parsedValue !== currentValue) {
                        observable(parseResult.parsedValue);
                    }
                    if (parseResult.formattedValue !== parseResult.parsedValue) {
                        observable.notifySubscribers(parseResult.parsedValue);
                    }
                }
            });

            result.unFormattedObservable = ko.computed(function () {
                return observable;
            });

            return result;
        };

        parseAndFormatNumeric = function (currentValue, newValue, format, allowDecimals) {
            var formattedCurrent = Globalize.format(currentValue, format);
            var parsedValue = newValue;
            var valueToWrite = newValue;
            if (newValue !== undefined) {
                if (typeof newValue !== "number") {
                    if (allowDecimals) {
                        parsedValue = Globalize.parseFloat(newValue);
                    }
                    else {
                        parsedValue = Globalize.parseInt(newValue);
                        var parsedFloat = Globalize.parseFloat(newValue);
                        if (parsedValue !== parsedFloat) {
                            parsedValue = null;
                        }
                    }
                }
            }

            //check for overflow.
            if (!sanityCheckNumber(newValue, parsedValue, format)) {
                parsedValue = null;
            }

            if (parsedValue !== undefined && parsedValue !== null && isNaN(parsedValue) === false) {
                valueToWrite = parsedValue;
            }
            if (valueToWrite === "") {
                valueToWrite = null;
            }

            return {
                parsedValue: valueToWrite,
                formattedValue: formattedCurrent
            };
        }

        parseAndFormatDateTime = function (currentValue, newValue, format, acceptedFormats) {
            var formattedCurrent = Globalize.format(currentValue, format);
            var parsedValue = newValue;
            var valueToWrite = newValue;
            if (newValue !== undefined) {
                if (!(newValue instanceof Date)) {
                    parsedValue = Globalize.parseDate(newValue, acceptedFormats);
                }
            }
            if (parsedValue) {
                //compensate timezoneoffset ??
                //parsedValue.setUTCMinutes(parsedValue.getMinutes() - parsedValue.getTimezoneOffset());
                valueToWrite = parsedValue;
            }

            return {
                parsedValue: valueToWrite,
                formattedValue: formattedCurrent
            };
        }

        sanityCheckNumber = function (newValue, parsedValue, format) {
            //sanity check to make sure we are not entering numbers > the max or < the min
            //newValue is the string value for the input : -  0 , 32
            //parsedValue is the number value from our Globalize parsing
            //format is the format we are using with Globalize
            //
            // Following approach should work for many cultures
            // - culture = nl-BE
            // - input is : '-  0  , 32'
            // - strip everything wich is not a decimal number, the decimal separator and the negative symbol
            //      => '-0,32'
            // - replace the culture specific decimal separator by the .
            //      => '-0.32'
            // - use parseFloat to convert to number
            //      => 0.32
            // - convert it back to string and replace the native decimal separator by the culture specific one
            //      => '-0,32'

            //find culture specific formattting stuff
            var culture = Globalize.findClosestCulture();
            var decSep = culture.numberFormat['.'];
            var negSymbol = culture.numberFormat['-'];
            //only keep decimal numbers, the decimal separator and the negative symbol
            var regEx = new RegExp('[^\\d' + decSep + negSymbol + ']', 'g');
            var newValueStripped = (newValue + '').replace(regEx, '');
            //replace the decimal separator with the language decimal separator
            newValueStripped = newValueStripped.replace(decSep, '.');
            //parse the string to float
            var parsedNewValue = parseFloat(newValueStripped);
            //replace the language decimal separator with the decimal separator 
            parsedNewValue = (parsedNewValue + '').replace('.', decSep);
            
            return (newValueStripped == parsedNewValue);
        }

        //expandFormat is not public on Globalize ...
        globalizeExpandFormat = function (format, cultureSelector) {
            var culture = Globalize.findClosestCulture(cultureSelector);
            var cal = culture.calendar;

            // expands unspecified or single character date formats into the full pattern.
            format = format || "F";
            var pattern,
                patterns = cal.patterns,
                len = format.length;
            if (len === 1) {
                pattern = patterns[format];
                if (!pattern) {
                    throw "Invalid date format string \'" + format + "\'.";
                }
                format = pattern;
            }
            else if (len === 2 && format.charAt(0) === "%") {
                // %X escape format -- intended as a custom format string that is only one character, not a built-in format.
                format = format.charAt(1);
            }
            return format;
        };

        getMetadata = function (metadata, propertyNames) {
            var propertyNameToGet = propertyNames.shift();
            var match = ko.utils.arrayFirst(metadata.properties, function (item) {
                return item.propertyName === propertyNameToGet;
            });

            if (propertyNames.length !== 0) {
                return getMetadata(match, propertyNames);
            }

            return match;
        };

        mapToViewModelByMetadata = function (data, viewmodel) {
            var metadata = viewmodel._metadataContainer.data;
            mapToViewModelByMetadataInternal(data, viewmodel, metadata);
        };

        //using the metadata to build up the viewmodel from scratch

        mapToViewModelByMetadataInternal = function (data, viewmodel, metadata) {
            //Loop metadata for all the Properties of the entity
            for (var i = 0; i < metadata.properties.length; i++) {
                var propMetadata = metadata.properties[i];
                var dataValue = null;
                if (data[propMetadata.propertyName] !== undefined) {
                    dataValue = data[propMetadata.propertyName];
                }
                if (propMetadata.isComplexType) {
                    var vm;
                    if (propMetadata.isListType) {
                        //ListType
                        //Create the observableArray for our ListType
                        viewmodel[propMetadata.propertyName] = ko.observableArray();
                        //Add items to observableArray
                        for (var j = 0; j < dataValue.length; j++) {
                            var listItem = dataValue[j];
                            //Convention => 'create<DataType>' function is used to create an item
                            vm = viewmodel._childs["create" + propMetadata.listTypeViewModelMetadata.dataType](propMetadata.listTypeViewModelMetadata);
                            mapToViewModelByMetadataInternal(listItem, vm, propMetadata.listTypeViewModelMetadata);
                            viewmodel[propMetadata.propertyName].push(vm);
                        }
                    }
                    else {
                        //ComplexType ( but not a list)
                        //Convention => 'create<DataType>' function is used to create an item
                        vm = viewmodel._childs["create" + propMetadata.dataType](propMetadata);
                        var observableChild = ko.observable(vm);
                        mapToViewModelByMetadataInternal(dataValue, vm, propMetadata);
                        viewmodel[propMetadata.propertyName] = observableChild;
                    }
                }
                else {
                    //primary property
                    if (viewmodel[propMetadata.propertyName] === undefined) {
                        //Create the observable
                        viewmodel[propMetadata.propertyName] = createObservable(viewmodel, propMetadata.propertyName);
                    }
                    //And set the value ( with a special case for Dates )
                    if (propMetadata.dataType === "Date" || propMetadata.dataType === "DateTime") {
                        //TODO timezone handling !!!
                        var parsed = Globalize.parseDate(dataValue, "yyyy-MM-ddTHH:mm:sszzz");
                        dataValue = parsed;
                        //compensate timezoneoffset ???
                        //value.setUTCMinutes(value.getMinutes() - value.getTimezoneOffset());
                    }
                    viewmodel[propMetadata.propertyName](dataValue);
                    //create and add a formatter if needed/possible
                    var formatter = createFormatter(viewmodel, propMetadata);
                    if (formatter) {
                        viewmodel._formatted[propMetadata.propertyName] = formatter;
                    }
                }
            }
        };

        createFormatter = function (viewmodel, propMetadata) {
            var formatter = null;
            //TODO add other dataTypes ??
            switch (propMetadata.dataType) {
                case "Byte":
                case "SByte":
                case "Int16":
                case "UInt16":
                case "Int32":
                case "UInt32":
                case "Int64":
                case "UInt64":
                    formatter = ko.metadata.createIntegerFormatter(viewmodel[propMetadata.propertyName]);
                    break;
                case "Single":
                case "Double":
                case "Decimal":
                    var scale = 4;
                    if (propMetadata.additionalMetadata) {
                        if (propMetadata.additionalMetadata.scale || propMetadata.additionalMetadata.scale === 0) {
                            scale = propMetadata.additionalMetadata.scale;
                        }
                    }
                    formatter = ko.metadata.createDecimalFormatter(viewmodel[propMetadata.propertyName], scale);
                    break;
                case "Date":
                case "Time":
                case "DateTime":
                    var dataType = propMetadata.dataType;
                    var acceptedFormats;
                    switch (dataType) {
                        case "Date":
                            acceptedFormats = getAcceptedDateAndTimeFormats().acceptedDateFormats;
                            break;
                        case "DateTime":
                            acceptedFormats = getAcceptedDateAndTimeFormats().acceptedDateTimeformats;
                            break;
                        case "Time":
                            acceptedFormats = getAcceptedDateAndTimeFormats().acceptedTimeformats;
                    };

                    formatter = ko.metadata.createDateFormatter(viewmodel[propMetadata.propertyName], acceptedFormats, null);
                    break;
            }
            return formatter;
        };

        validateObservable = function (observable) {
            var i = 0,
                rule, // the rule validator to execute
                ctx, // the current Rule Context for the loop
                ruleContexts = observable.validationRules, //cache for iterator
                len = ruleContexts.length; //cache for iterator

            observable.validationMessages.removeAll();
            for (; i < len; i++) {

                //get the Rule Context info to give to the core Rule
                ctx = ruleContexts[i];

                // checks an 'onlyIf' condition
                if (ctx.condition && !ctx.condition()) {
                    continue;
                }

                //get the core Rule to use for validation
                rule = exports.validationRules[ctx.rule];

                if (rule.async || ctx.async) {
                    //run async validation
                    validateAsync(observable, rule, ctx);

                } else {
                    //run normal sync validation
                    if (!validateSync(observable, rule, ctx)) {
                        //return false; //break out of the loop
                    }
                }
            }
            return true;
        };

        validateSync = function (observable, rule, ctx) {
            //default params is true, eg. required = true
            var params = ctx.params === undefined ? true : ctx.params;
            //Execute the validator and see if its valid 
            if (!rule.validator(observable(), params)) {
                //not valid, so format the error message and stick it in the 'error' variable
                var message = ko.metadata.formatMessage(ctx.message || rule.message, observable.displayName, rule, ctx.params);
                observable.validationMessages.push(message);
                return false;
            } else {
                return true;
            }
        };

        // addRule:
        // This takes in a ko.observable and a Rule Context - which is just a rule name and params to supply to the validator
        // ie: ko.validation.addRule(myObservable, {
        //          rule: 'required',
        //          params: true
        //      });
        //
        addRule = function (observable, rule) {
            //TODO this is done in another way
            //observable.extend({ validatable: true });

            //push a Rule Context to the observables local array of Rule Contexts
            observable.validationRules.push(rule);
            return observable;
        };

        addExtender = function (ruleName) {
            ko.extenders[ruleName] = function (observable, params) {
                //params can come in a few flavors
                // 1. Just the params to be passed to the validator
                //      var test = ko.observable(3).extend({
                //                      required: true
                //                  })
                //
                // 2. An object containing 
                //              the Params to pass to the validator
                //              optional, the Message to be used 
                //              optional, a condition when the validation rule is to be applied 
                //      var test = ko.observable(3).extend({
                //              max: {
                //                  params: 2,
                //                  message: '{0} has a Max of {1}',
                //                  onlyIf: function() {
                //                              return specialField.IsVisible();
                //                      }
                //            }
                //      )};
                //
                //if it has a message or condition object, then its an object literal to use
                if (params.message || params.onlyIf) {
                    return addRule(observable, {
                        rule: ruleName,
                        message: params.message,
                        params: utils.isEmptyVal(params.params) ? true : params.params,
                        condition: params.onlyIf
                    });
                } else {
                    return addRule(observable, {
                        rule: ruleName,
                        //still can be an object literal
                        params: params.params || params
                    });
                }
            };
        };

        // loops through all ko.metatdata.validationrules and adds them as extenders to ko.extenders
        registerExtenders = function () {
            for (var ruleName in exports.validationRules) {
                if (exports.validationRules.hasOwnProperty(ruleName)) {
                    if (!ko.extenders[ruleName]) {
                        addExtender(ruleName);
                    }
                }
            }
        };


        realTypeOf = function (v) {
            //http://joncom.be/code/realtypeof/
            if (typeof (v) === "object") {
                if (v === null) return "null";
                if (v.constructor === (new Array()).constructor) return "array";
                if (v.constructor === (new Date()).constructor) return "date";
                if (v.constructor === (new RegExp()).constructor) return "regex";
                return "object";
            }
            return typeof (v);
        };

        formatJSON = function (oData, sIndent) {
            //http://joncom.be/code/javascript-json-formatter/
            var iCount, sHTML;

            if (arguments.length < 2) {
                sIndent = "";
            }
            var sIndentStyle = "&nbsp;&nbsp;&nbsp;&nbsp;";
            var sDataType = realTypeOf(oData);

            // open object
            if (sDataType === "array") {
                if (oData.length === 0) {
                    return "[]";
                }
                sHTML = "[";
            } else {
                iCount = 0;
                $.each(oData, function () {
                    iCount++;
                    return;
                });
                if (iCount === 0) { // object is empty
                    return "{}";
                }
                sHTML = "{";
            }

            // loop through items
            iCount = 0;
            $.each(oData, function (sKey, vValue) {
                if (iCount > 0) {
                    sHTML += ",";
                }
                if (sDataType === "array") {
                    sHTML += ("<BR/>" + sIndent + sIndentStyle);
                } else {
                    sHTML += ("<BR/>" + sIndent + sIndentStyle + "\"" + sKey + "\"" + ": ");
                }

                // display relevant data type
                switch (realTypeOf(vValue)) {
                    case "array":
                    case "object":
                        sHTML += formatJSON(vValue, (sIndent + sIndentStyle));
                        break;
                    case "boolean":
                    case "number":
                        sHTML += vValue.toString();
                        break;
                    case "null":
                        sHTML += "null";
                        break;
                    case "string":
                        sHTML += ("\"" + vValue + "\"");
                        break;
                    default:
                        sHTML += ("TYPEOF: " + typeof (vValue));
                }

                // loop
                iCount++;
            });

            // close object
            if (sDataType === "array") {
                sHTML += ("<BR/>" + sIndent + "]");
            } else {
                sHTML += ("<BR/>" + sIndent + "}");
            }

            // return
            return sHTML;
        };

        //Accepted Date Formats
        var acceptedDateFormats = null;
        //Accepted DateTime Formats
        var acceptedDateTimeformats = null;
        //Accepted Time Formats
        var acceptedTimeformats = null;

        getAcceptedDateAndTimeFormats = function () {
            if (acceptedDateFormats === null) {
                //We want to support short date short time (d t) and short date long time (d T) and ... to parse datetime input
                //TODO provide even more valid formats for parsing
                var shortDateFormat = globalizeExpandFormat("d");
                var shortTimeFormat = globalizeExpandFormat("t");
                var longTimeFormat = globalizeExpandFormat("T");

                acceptedDateFormats = [0];
                acceptedDateTimeformats = [1];
                acceptedTimeformats = [1];

                //Accepted Date Formats
                acceptedDateFormats[0] = shortDateFormat;
                //Accepted DateTime Formats
                acceptedDateTimeformats[0] = shortDateFormat + " " + shortTimeFormat;
                acceptedDateTimeformats[1] = shortDateFormat + " " + longTimeFormat;
                //Accepted Time Formats
                acceptedTimeformats[0] = shortTimeFormat;
                acceptedTimeformats[1] = longTimeFormat;
            }

            return {
                acceptedDateFormats: acceptedDateFormats,
                acceptedDateTimeformats: acceptedDateTimeformats,
                acceptedTimeformats: acceptedTimeformats
            }
        }

        return {
            formatMessage: formatMessage,
            registerExtenders: registerExtenders,
            createObservable: createObservable,
            validateObservable: validateObservable,
            createIntegerFormatter: createIntegerFormatter,
            createDecimalFormatter: createDecimalFormatter,
            createDateFormatter: createDateFormatter,
            formatJSON: formatJSON,
            getMetadata: getMetadata,
            mapToViewModelByMetadata: mapToViewModelByMetadata
            //isObservableArray: isObservableArray
        };

    }());
    // expose api publicly
    ko.utils.extend(metadata, api);

    //#region validationRules:..
    metadata.validationRules = {};
    metadata.validationRules.validateRequired = {
        validator: function (val, required) {
            var stringTrimRegEx = /^\s+|\s+$/g,
                testVal;

            if (val === undefined || val === null) {
                return !required;
            }

            testVal = val;
            if (typeof (val) === "string") {
                testVal = val.replace(stringTrimRegEx, '');
            }

            // if they passed: { required: false }, then don't require this
            if (!required) {
                return true;
            }

            return ((testVal + '').length > 0);
        },
        message: '{0} is required.'
    };
    metadata.validationRules.validateMaxLength = {
        validator: function (val, options) {
            if (val === undefined || val === null || val.length === undefined) {
                return true;
            }
            else {
                return val.length <= options.max;
            }
        },
        message: 'Please enter no more than {1} characters for {0}.',
        messageArguments: function (options) {
            var args = [];
            args.push(options.max);
            return args;
        }
    };
    metadata.validationRules.validateMinLength = {
        validator: function (val, options) {
            if (val === undefined || val === null || val.length === undefined) {
                return true;
            }
            else {
                return val.length >= options.min;
            }
        },
        message: 'Please enter at least {1} characters for {0}.',
        messageArguments: function (options) {
            var args = [];
            args.push(options.min);
            return args;
        }
    };
    //EMail validation
    metadata.validationRules.validateEmail = {
        validator: function (value, options) {
            var result = true;
            if (value !== undefined && value !== "") {
                result = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(value);
            }

            return result;
        },
        message: "Please enter a valid email address for {0}."
    };
    //Validates if a number is a whole number.
    //  We do not try to parse non-number formats, we assume the binding (createIntegerFormatter) has done the parsing to the number type.
    //  The string value '123' will not validate as a whole number.
    //      This is OK. Behind the scenes we are working with ko.observables, so if we want to do calculations on those (fi ko.computed), 
    //      we want them to be of type number.
    metadata.validationRules.validateNumberIsWhole = {
        validator: function (value, options) {
            var result = true;
            if (typeof value !== 'number') {
                result = false;
            }
            else {
                if (Math[value < 0 ? 'ceil' : 'floor'](value) !== value ) {
                    result = false;
                }
            }
            return result;
        },
        message: "{0} is not a valid number."
    };
    //Number validation
    //  We do not try to parse non-number formats, we assume the binding (createIntegerFormatter) has done the parsing to the number type.
    //      See remark for validateNumberIsWhole
    metadata.validationRules.validateNumber = {
        validator: function (value, options) {
            var result = true;
            if (value !== undefined && value !== null) {
                if (typeof value !== 'number') {
                    result = false;
                }
            }
            return result;
        },
        message: "{0} is not a valid decimal."
    };
    //Date validation
    metadata.validationRules.validateDate = {
        validator: function (value, options) {
            //TODO review this
            var dateValue = value;
            if (value !== undefined && value !== "" && !(value instanceof Date)) {
                dateValue = Globalize.parseDate(value, "en");
            }

            return dateValue;
        },
        message: "{0} is not a valid date."
    };
    //Required validation
    metadata.validationRules.validateInRequiredFields = {
        // The actual validation logic
        validator: function (value, options) {
            var result = true;
            if (options.requiredFields.indexOf(options.fieldName) >= 0 && (value === undefined || value === null || value === "")) {
                result = false;
            }
            return result;
        },
        message: "{0} is required."
    };
    //Range validation
    metadata.validationRules.range = {
        validator: function (value, options) {
            var result = true;
            if (value !== undefined) {
                result = value >= options.min && value <= options.max;
            }

            return result;
        },
        message: "{0} must be between {1} and {2}",
        messageArguments: function (options) {
            var args = [];
            args.push(options.min);
            args.push(options.max);
            return args;
        }
    };
    //Equal validation
    metadata.validationRules.equal = {
        validator: function (value, options) {
            return value == options.other();
        },
        message: "{0} must be equal to {1}",
        messageArguments: function (options) {
            var args = [];
            args.push(options.other.displayName);
            return args;
        },
        ruleAdding: function (target, viewmodel, options) {
            //TODO only when target and options.other is an observable
            //Example: When PasswordVerify must be equal to Password, 
            //  we want a change in Password to trigger the observable PasswordVerify.
            //  Doing so ensures the validation is triggered by both fields.
            options.other.subscribe(function () {
                target.valueHasMutated();
            });
        }
    };
    //now register all of these!
    (function () {
        metadata.registerExtenders();
    }());

    //#endregion validationRules:..

    //Enables the metadata framework for the given observable
    //This one should be called before other 'metadata' extenders
    ko.extenders.metadataValidation = function (target, metadataValidationOptions) {

        var viewModel = metadataValidationOptions.viewModel;
        var modelValidationContainer = metadataValidationOptions.viewModel._validationContainer;

        var propertyMetadata = viewModel.getMetadata(metadataValidationOptions.fieldName);
        var modelMetaData = viewModel._metadataContainer.data;

        target.fieldName = metadataValidationOptions.fieldName;
        target.displayName = propertyMetadata.displayName;

        target.validationMessages = ko.observableArray();

        target.isValid = ko.computed(function () {
            return target.validationMessages().length === 0;
        });

        target.isValidForUi = ko.computed(function () {
            var isValid = target.isValid();
            var displayValidation = modelValidationContainer.displayValidation();
            if (displayValidation) {
                return isValid;
            }
            return true;
        });

        target.validationMessage = ko.computed(function () {
            return target.validationMessages().join("\r\n");
        });

        // array of all rules for the given target
        target.validationRules = [];

        // check the observable against all attached validators
        target.validate = function () {
            ko.metadata.validateObservable(target);
        };

        // validate when it changes
        target.subscribe(target.validate);

        // push target to the model
        modelValidationContainer.validationTargets.push(target);

        return target;
    };

    ko.bindingHandlers.dataValue = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var accessor = valueAccessor();

            ko.applyBindingsToNode(element, { value: valueAccessor() });
            ko.applyBindingsToNode(element, { validationElement: valueAccessor() });
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            // This will be called once when the binding is first applied to an element,
            // and again whenever the associated observable changes value.
            // Update the DOM element based on the supplied values here.
        }
    };

    ko.bindingHandlers.validationElement = {
        update: function (element, valueAccessor) {
            var observable = valueAccessor();
            //if we are binding to a 'formatted' observable, we need to work with the actual observable
            if (observable.unFormattedObservable !== undefined && ko.isComputed(observable.unFormattedObservable)) {
                observable = observable.unFormattedObservable();
            }
            //config = ko.validation.utils.getConfigOptions(element),
            var config = ko.metadata.configuration;
            var val = ko.utils.unwrapObservable(observable);
            var isValid = observable.isValid();

            // create an evaluator function that will return something like:
            // css: { validationElement: true }
            var cssSettingsAccessor = function () {
                var css = {};
                var shouldShow = !isValid;
                if (!config.decorateElement) {
                    shouldShow = false;
                }

                // css: { validationElement: false }
                css[config.errorElementClass] = shouldShow;

                return css;
            };

            //add or remove class on the element;
            ko.bindingHandlers.css.update(element, cssSettingsAccessor);

            if (!config.errorsAsTitle) { return; }

            var errorMsgTitleAccessor = function () {
                if (!isValid) {
                    return { title: observable.validationMessage, 'data-orig-title': utils.getOriginalElementTitle(element) };
                } else {
                    return { title: utils.getOriginalElementTitle(element), 'data-orig-title': null };
                }
            };
            ko.bindingHandlers.attr.update(element, errorMsgTitleAccessor);
        }
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
    templateEngine.addTemplate("kov_label", "<label data-bind=\"attr: { for: data.fieldName }, text: data.displayName + ' : '\"></label>");
}));