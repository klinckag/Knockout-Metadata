using System;
using System.Collections.Generic;
using System.Web.Http;
using Sample.Web.Mvc.Gui.Models;

namespace Sample.Web.Mvc.Gui.Api
{
    public class PersonController : ApiController
    {
        // GET api/personapi
        public IEnumerable<string> Get()
        {
            return new string[] { "value1", "value2" };
        }

        // GET api/person/5
        public Person Get(int id)
        {
            return new Person()
            {
                FirstName = "Geert",
                EMail = "Bla.net",
                BirthDate = new DateTime(2010, 1, 1),
                SomeDecimal = (decimal)10.5,
                SomeInt = 66,
                Address = new Address()
                {
                    Street = "SomeStreet",
                    Number = "817"
                },
                Skills = new List<Skill>()
                {
                    new Skill(){ Name= "One", LevelOfExpertise=8 },
                    new Skill(){ Name= "Two", LevelOfExpertise=6 }
                }
            };
        }

        // POST api/personapi
        public void Post([FromBody]string value)
        {
        }

        // PUT api/personapi/5
        public void Put(int id, [FromBody]string value)
        {
        }

        // DELETE api/personapi/5
        public void Delete(int id)
        {
        }
    }
}
