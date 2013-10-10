using System.Collections.Generic;

namespace Gkl.Web.Mvc.Knockout.Metadata
{
    public class ViewModelValidationRule
    {
        public static ViewModelValidationRule CreateRequiredRule()
        {
            ViewModelValidationRule rule = new ViewModelValidationRule("required");
            rule.Params.Add("isRequired", true);

            return rule;
        }

        public ViewModelValidationRule(string name)
        {
            this.Name = name;
            this.Params = new Dictionary<string, object>();
        }

        public string Name { get; set; }

        public string ErrorMessage { get; set; }

        public Dictionary<string, object> Params { get; set; }
    }
}
