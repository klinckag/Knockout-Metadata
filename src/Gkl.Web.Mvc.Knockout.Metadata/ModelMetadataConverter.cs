using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Web.Mvc;

namespace Gkl.Web.Mvc.Knockout.Metadata
{
    internal class ModelMetadataConverter
    {
        private readonly ModelMetadata _modelMetadata;
        private readonly ControllerContext _controllerContext;

        private ViewModelMetadata _viewModelMetadata;

        public ModelMetadataConverter(ModelMetadata modelMetadata, ControllerContext controllerContext)
        {
            _modelMetadata = modelMetadata;
            _controllerContext = controllerContext;
        }

        public ViewModelMetadata Convert()
        {
            _viewModelMetadata = new ViewModelMetadata()
            {
                PropertyName = _modelMetadata.PropertyName, //ToCamelCase(_modelMetadata.PropertyName),
                DisplayName = _modelMetadata.DisplayName ?? _modelMetadata.PropertyName,
                DataType = _modelMetadata.DataTypeName != null ? _modelMetadata.DataTypeName : (Nullable.GetUnderlyingType(_modelMetadata.ModelType) != null ? Nullable.GetUnderlyingType(_modelMetadata.ModelType).Name : _modelMetadata.ModelType.Name),
                IsRequired = _modelMetadata.IsRequired,
                IsComplexType = _modelMetadata.IsComplexType
            };

            foreach (var key in _modelMetadata.AdditionalValues.Keys)
            {
                _viewModelMetadata.AdditionalMetadata.Add(key, _modelMetadata.AdditionalValues[key]);
            }

            this.AddValidators();

            if (_modelMetadata.IsComplexType)
            {
                if (_modelMetadata.ModelType.IsGenericType && typeof(IEnumerable).IsAssignableFrom(_modelMetadata.ModelType))
                {
                    _viewModelMetadata.IsListType = true;

                    var gtrd = _modelMetadata.ModelType.GetGenericTypeDefinition();
                    Type typeInEnumerable = _modelMetadata.ModelType.GetGenericArguments()[0];

                    _viewModelMetadata.ListTypeViewModelMetadata = ViewModelMetadata.GetMetadataForType(typeInEnumerable, _controllerContext);
                }
                else
                {
                    foreach (ModelMetadata propertyModelMetadata in _modelMetadata.Properties)
                    {
                        ModelMetadataConverter converter = new ModelMetadataConverter(propertyModelMetadata, _controllerContext);
                        _viewModelMetadata.Properties.Add(converter.Convert());
                    }
                }
            }

            return _viewModelMetadata;
        }

        private void AddValidators()
        {
            IEnumerable<ModelValidator> vals = ModelValidatorProviders.Providers.GetValidators(_modelMetadata, _controllerContext);
            List<ModelClientValidationRule> clientValidators = vals.SelectMany(v => v.GetClientValidationRules()).ToList();
            foreach (ModelClientValidationRule mcvr in clientValidators)
            {
                ViewModelValidationRule rule = new ViewModelValidationRule(mcvr.ValidationType);
                rule.ErrorMessage = mcvr.ErrorMessage;
                foreach (var item in mcvr.ValidationParameters)
                {
                    rule.Params.Add(item.Key, item.Value);
                }
                _viewModelMetadata.ValidationRules.Add(rule);
            }
        }

        private static string ToCamelCase(string text)
        {
            if (text == null)
            {
                return text;
            }
            return text[0].ToString().ToLower() + text.Substring(1);
        }
    }
}
