const LocalStrategy = require("passport-local").Strategy;
const passport = require("passport");
const bcrpypt = require("bcrypt");
const User = require("../../models/User");


passport.use(new LocalStrategy((username,password,done) => {

    User.findOne({username},(err,user) => {

        if(err){
            return done(err,null,"bir hata oluştu")
        } 

        if(!user){
            return done(null,false,"user not found");
        }


        bcrpypt.compare(password,user.password,(err,res) =>{

            if(res){
                    if(user.username == "admin"){
                        return done(null,user,"Admin Giriş Yaptı") 
                    }
                    else{
                        return done(null,user,user.username +" Giriş Yaptı")   
                    }
                
            } else{
                return done(null,false,"Hatali sifre")
            } 


        })

    })

}));
passport.serializeUser(function(user,done){
    done(null,user.id)
});

passport.deserializeUser(function(id,done){
    User.findById(id,function(err,user){
        done(err,user);
    });
});




