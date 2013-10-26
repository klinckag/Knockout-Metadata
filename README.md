#Knockout-Metadata

A metadata based validation library for [Knockout JS](http://knockoutjs.com)

Based on [the Knockout-Validation Plugin](https://github.com/Knockout-Contrib/Knockout-Validation)

###State
Proof of concept

###License

MIT license

#Getting Started
###Define the model in .NET
```C#
    public class Person
    {
        public Person()
        {
        }

        [Required]
        [StringLength(50)]
        [Display(Name = "Voornaam")]
        public string FirstName { get; set; }

        [Required]
        [StringLength(50, MinimumLength = 10)]
        [Display(Name = "Familienaam")]
        public string LastName { get; set; }
    }
```
###Define the knockout viewmodel
It is not necessary to specify the observables. They will be added automatically by the metadata plugin.
```javascript
  Person = function (metadata) {
      var self = this;
      //some plumbing to enable the metadata plugin magic
      ko.metadata.ViewModelBase.call(self, metadata);

      //These are added automatically ( by the mapToViewModelByMetadata )
      //self.FirstName = ko.observable();
      //self.LastName = ko.observable();      
  };
```

###Define the HTML and knockout bindings
```HTML
<div data-bind="labelBinding: FirstName">FirstName</div>
<input id="FirstName" type="text" data-bind="dataValue: FirstName" /><div data-bind="errorBinding: FirstName"></div>
<br />
<div>FullName</div>
<div data-bind="text: FullName"></div>
<br />
<div data-bind="labelBinding: LastName">LastName</div>
<input id="LastName" type="text" data-bind="dataValue: LastName" /><div data-bind="errorBinding: LastName"></div>
<br />
```

Get the data and apply the bindings.

```javascript
$(document).ready(function(){
    var metadata = @Html.Raw(((object)Model).ToJson());

    Globalize.culture("nl-BE");

    $.getJSON("/api/Person/121").success(function(data){
        var personVm = new app.person.Person(metadata);
        ko.metadata.mapToViewModelByMetadata(data, personVm);
        ko.applyBindings(personVm);
    }).error(function(data){
        alert(data);
    });
});
```
* [metadata](https://github.com/klinckag/Knockout-Metadata/wiki/Example-metadata) holds all info to set up validation
* Globalize is used to privide locale aware validation, parsing and formatting.
* mapToViewModelByMetadata uses the metadata to map the actual data to the view model ( and automatically creates the necessary observables )

###Result
![](https://raw.github.com/klinckag/Knockout-Metadata/master/doc/GettingStartedResult.png)
