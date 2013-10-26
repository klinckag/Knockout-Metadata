var app = app || {};
app.person = function () {
    Address = function (metadata) {
        var self = this;
        //ko.utils.extend(self, new ko.metadata.ViewModelBase(metadata));
        ko.metadata.ViewModelBase.call(self, metadata);

        //These are created automagically ( by the mapToViewModelByMetadata)
        //self.Street = self.createObservable("Street");
    };

    Skill = function (metadata) {
        var self = this;
        //ko.utils.extend(self, new ko.metadata.ViewModelBase(metadata));
        ko.metadata.ViewModelBase.call(self, metadata);

        //These are created automagically ( by the mapToViewModelByMetadata)
        //self.Name = self.createObservable("Name");
        //self.LevelOfExpertise = self.createObservable("LevelOfExpertise");
    };

    Person = function (metadata) {
        var self = this;
        //ko.utils.extend(self, new ko.metadata.ViewModelBase(metadata));
        ko.metadata.ViewModelBase.call(self, metadata);

        //TODO find a better way to handle this
        //helpers to create instances of child viewmodels go on the _childs function
        self._childs = function () { }
        self._childs.createAddress = function (metadata) {
            return new Address(metadata)
        }
        self._childs.createSkill = function (metadata) {
            return new Skill(metadata)
        }

        //These are created automagically ( by the mapToViewModelByMetadata)
        //self.FirstName = self.createObservable("FirstName");
        //self.LastName = self.createObservable("LastName");
        //self.EMail = self.createObservable("EMail");
        //self.SomeInt = self.createObservable("SomeInt");
        //self.SomeDecimal = self.createObservable("SomeDecimal");
        //self.BirthDate = self.createObservable("BirthDate");

        //These are created automagically ( by the mapToViewModelByMetadata)
        //Address
        //self.Address = ko.observable({
        //    Street: self.createObservable("Address.Street")
        //});

        //These are created automagically ( by the mapToViewModelByMetadata)
        //Skills
        //self.Skills = ko.observableArray();
        //self.Skills.create = function (metadata) {
        //    var vm = new Skill(metadata);
        //    vm._validationContainer.displayValidation(true);
        //    return vm;
        //}

        //These are created automagically ( by the mapToViewModelByMetadata)
        //Formatted stuff
        //self._formatted.SomeInt = ko.metadata.createIntegerFormatter(self.SomeInt);
        //self._formatted.SomeDecimal = ko.metadata.createDecimalFormatter(self.SomeDecimal, 4);
        //self._formatted.BirthDate = self.createDateFormatter(self.BirthDate);


        //Computed observables must be added after the mapToViewModelByMetadata() has been called
        //  mapToViewModelByMetadata dynamically creates the viewModel and the observables are available only after the mapping is done
        self.addComputed = function () {
            self.FullName = ko.computed(function () {
                return self.FirstName() + ' ' + self.LastName();
            });
        }

        //self.isAllValid = ko.computed(function () {
        //    return self.isValid();
        //});

        ////Trigger validation when the required fields change
        //self._validation.requiredFields.subscribe(self.isValid);

        //self.showValidation = function () {
        //    self._validation.displayValidation(!self._validation.displayValidation());
        //}

        //self.addRequiredField = function () {
        //    self._validation.requiredFields.push("LastName");
        //}

        //self.removeRequiredField = function () {
        //    self._validation.requiredFields.removeAll();
        //    self._validation.requiredFields.push(requiredFields);
        //}

        self.save = function () {
            $.ajax({
                type: 'POST',
                url: '/api/Person',
                contentType: 'application/json; charset=utf-8',
                data: ko.toJSON(self),
            }).done(function (msg) {
                alert("Data Saved: " + msg);
            });
        };
    };

    return {
        Address: Address,
        Person: Person
    };
}();