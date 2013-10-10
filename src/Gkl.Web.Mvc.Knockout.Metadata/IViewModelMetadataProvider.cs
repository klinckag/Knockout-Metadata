using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web.Mvc;

namespace Gkl.Web.Mvc.Knockout.Metadata
{
    public interface IViewModelMetadataProvider
    {
        ViewModelMetadata GetMetadata<TModel>(ControllerContext controllerContext);

        ViewModelMetadata GetMetadataForType(Type type, ControllerContext controllerContext);
    }
}
