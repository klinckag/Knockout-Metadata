using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Mvc;

namespace Gkl.Web.Mvc.Knockout.Metadata
{
    public class ViewModelMetadataProvider : IViewModelMetadataProvider
    {
        public ViewModelMetadata GetMetadata<TModel>(ControllerContext controllerContext)
        {
            return GetMetadataForType(typeof(TModel), controllerContext);
        }

        public ViewModelMetadata GetMetadataForType(Type type, ControllerContext controllerContext)
        {
            ModelMetadata modelMetadata = ModelMetadataProviders.Current.GetMetadataForType(null, type);
            ModelMetadataConverter converter = new ModelMetadataConverter(modelMetadata, controllerContext);
            ViewModelMetadata viewModelMetadata = converter.Convert();

            return viewModelMetadata;
        }
    }
}
