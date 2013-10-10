var app = app || {};
app.person = function () {
    Address = function (metadata) {
        var self = this;
        ko.utils.extend(self, new ko.metadata.ViewModelBase(metadata));

        self.Street = self.createObservable("Street");
    };

    Skill = function (metadata) {
        var self = this;
        ko.utils.extend(self, new ko.metadata.ViewModelBase(metadata));

        self.Name = self.createObservable("Name");
        self.LevelOfExpertise = self.createObservable("LevelOfExpertise");
    };

    Person = function (metadata) {
        var self = this;
        ko.utils.extend(self, new ko.metadata.ViewModelBase(metadata));

        //These are created automagically ( by the mapToViewModelByMetadata)
        //self.FirstName = self.createObservable("FirstName");
        //self.LastName = self.createObservable("LastName");
        //self.EMail = self.createObservable("EMail");
        //self.SomeInt = self.createObservable("SomeInt");
        //self.SomeDecimal = self.createObservable("SomeDecimal");
        //self.BirthDate = self.createObservable("BirthDate");

        //Address
        self.Address = ko.observable({
            Street: self.createObservable("Address.Street")
        });

        //Skills
        self.Skills = ko.observableArray();
        self.Skills.create = function (metadata) {
            var vm = new Skill(metadata);
            vm._validationContainer.displayValidation(true);
            return vm;
        }

        //These are created automagically ( by the mapToViewModelByMetadata)
        //self._formatted.SomeInt = ko.metadata.createIntegerFormatter(self.SomeInt);
        //self._formatted.SomeDecimal = ko.metadata.createDecimalFormatter(self.SomeDecimal, 4);
        //self._formatted.BirthDate = self.createDateFormatter(self.BirthDate);

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