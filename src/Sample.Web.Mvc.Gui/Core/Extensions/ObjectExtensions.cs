using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;

namespace Sample.Web.Mvc.Gui.Core.Extensions
{
    public static class ObjectExtensions
    {
        public static string ToJson(this object obj)
        {
            JsonSerializer js = JsonSerializer.Create(new JsonSerializerSettings()
            {
                ContractResolver = new CamelCasePropertyNamesContractResolver()
            });
            var jw = new StringWriter();
            js.Serialize(jw, obj);
            return jw.ToString();
        }
    }
}