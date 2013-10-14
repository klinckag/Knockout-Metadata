using System;
using System.Collections.Generic;
using System.Web.Mvc;

namespace Gkl.Web.Mvc.Knockout.Metadata
{
    public class ViewModelMetadata
    {
        public static ViewModelMetadata GetMetadata<TModel>(ControllerContext controllerContext)
        {
            return GetMetadataForType(typeof(TModel), controllerContext);
        }

        public static ViewModelMetadata GetMetadataForType(Type type, ControllerContext controllerContext)
        {
            ModelMetadata modelMetadata = ModelMetadataProviders.Current.GetMetadataForType(null, type);
            ModelMetadataConverter converter = new ModelMetadataConverter(modelMetadata, controllerContext);
            ViewModelMetadata viewModelMetadata = converter.Convert();

            return viewModelMetadata;
        }

        public ViewModelMetadata()
        {
            this.Properties = new List<ViewModelMetadata>();
            this.ValidationRules = new List<ViewModelValidationRule>();
            this.AdditionalMetadata = new Dictionary<string, object>();
        }

        public string PropertyName { get; set; }

        public string DisplayName { get; set; }

        public string DataType { get; set; }

        public bool IsRequired { get; set; }

        public bool IsComplexType { get; set; }

        public bool IsListType { get; set; }

        public Dictionary<string, object> AdditionalMetadata { get; private set; }

        public ViewModelMetadata ListTypeViewModelMetadata { get; set; }

        public IList<ViewModelMetadata> Properties { get; private set; }

        public IList<ViewModelValidationRule> ValidationRules { get; private set; }
    }
}
