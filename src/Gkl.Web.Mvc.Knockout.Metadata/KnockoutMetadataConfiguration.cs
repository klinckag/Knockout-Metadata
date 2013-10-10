using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Gkl.Web.Mvc.Knockout.Metadata
{
    public class KnockoutMetadataConfiguration
    {
        private IViewModelMetadataProvider _viewModelMetadataProvider;

        public KnockoutMetadataConfiguration()
        {
            _viewModelMetadataProvider = new CachedViewModelMetadataProvider();
        }

        public IViewModelMetadataProvider ViewModelMetadataProvider
        {
            get { return _viewModelMetadataProvider; }
        }
    }
}
