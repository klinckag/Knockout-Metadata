using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Gkl.Web.Mvc.Knockout.Metadata
{
    public static class GlobalKnockoutMetadataConfiguration
    {
        private static KnockoutMetadataConfiguration _configuration = new KnockoutMetadataConfiguration();

        public static KnockoutMetadataConfiguration Configuration 
        {
            get { return _configuration; }
            set { _configuration = value; }
        }
    }
}
