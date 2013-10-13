
using System.ComponentModel.DataAnnotations;
namespace Sample.Web.Mvc.Gui.Models
{
    public class Skill
    {
        public Skill()
        {

        }

        [Required]
        public string Name { get; set; }

        [Range(1, 10)]
        public int LevelOfExpertise { get; set; }
    }
}