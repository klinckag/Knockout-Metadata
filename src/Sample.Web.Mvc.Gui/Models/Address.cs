using System.ComponentModel.DataAnnotations;

namespace Sample.Web.Mvc.Gui.Models
{
    public class Address
    {
        public Address()
        {

        }

        [Required]
        [StringLength(20, MinimumLength = 2)]
        public string Street { get; set; }

        [Required]
        [StringLength(10)]
        public string Number { get; set; }
    }
}