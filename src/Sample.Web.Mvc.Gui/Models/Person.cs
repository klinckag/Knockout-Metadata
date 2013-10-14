using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Web.Mvc;

namespace Sample.Web.Mvc.Gui.Models
{
    public class Person
    {
        public Person()
        {

        }

        [Range(0, 100)]
        public int SomeRange { get; set; }

        [Required]
        [StringLength(50)]
        [Display(Name = "Voornaam")]
        public string FirstName { get; set; }

        [Required]
        [StringLength(50, MinimumLength = 10)]
        [Display(Name = "Famillienaam")]
        public string LastName { get; set; }

        [Required]
        [DataType(DataType.EmailAddress)]
        public string EMail { get; set; }

        [Required]
        public int? SomeInt { get; set; }

        //public Int16? SomeInt16 { get; set; }

        //public Int64? SomeInt64 { get; set; }

        [Required]
        [AdditionalMetadata("scale", 2)]
        public decimal? SomeDecimal { get; set; }

        [DataType(DataType.Date)]
        public DateTime BirthDate { get; set; }

        public Address Address { get; set; }

        public List<Skill> Skills { get; set; }
    }
}