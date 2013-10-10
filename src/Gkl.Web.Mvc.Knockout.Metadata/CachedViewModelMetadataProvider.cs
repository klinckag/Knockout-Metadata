using System;
using System.Runtime.Caching;

namespace Gkl.Web.Mvc.Knockout.Metadata
{
    public class CachedViewModelMetadataProvider : IViewModelMetadataProvider
    {
        private CacheItemPolicy _cacheItemPolicy = new CacheItemPolicy { SlidingExpiration = TimeSpan.FromMinutes(20) };
        private ObjectCache _metadataCache;

        public CachedViewModelMetadataProvider()
        {
        }

        protected internal CacheItemPolicy CacheItemPolicy
        {
            get { return _cacheItemPolicy; }
            set { _cacheItemPolicy = value; }
        }

        protected internal ObjectCache MetadataCache
        {
            get { return _metadataCache ?? MemoryCache.Default; }
            set { _metadataCache = value; }
        }

        public ViewModelMetadata GetMetadata<TModel>(System.Web.Mvc.ControllerContext controllerContext)
        {
            return GetMetadataForType(typeof(TModel), controllerContext);
        }

        public ViewModelMetadata GetMetadataForType(Type type, System.Web.Mvc.ControllerContext controllerContext)
        {
            string cacheKey = type.FullName;
            ViewModelMetadata viewModelMetaData = (ViewModelMetadata)this.MetadataCache.Get(cacheKey);
            if (viewModelMetaData == null)
            {
                ViewModelMetadataProvider provider = new ViewModelMetadataProvider();
                viewModelMetaData = provider.GetMetadataForType(type, controllerContext);
                this.MetadataCache.Add(cacheKey, viewModelMetaData, this.CacheItemPolicy);
            }
            return viewModelMetaData;
        }
    }
}
