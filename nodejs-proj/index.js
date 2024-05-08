const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs')
const session = require('express-session');
const cookieParser = require('cookie-parser');

const port = 5187;
const app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false
}));

app.use(express.json());
app.use(express.static("public"));

function validateEmail(email){
    return (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
}

function validatePetForm(formInfo) {
    const requiredFields = ['typepet', 'breed', 'ages', 'gender', 'group'];
    for (const field of requiredFields) {
        if (!formInfo[field] || formInfo[field].trim() === '') {
            return false;
        }
    }
    return true;
}

let id = 1;
app.get('/', (req, res) => {
    const currLoggedIn = req.cookies.loggedIn === 'true';
    res.render("home.ejs", {currLoggedIn});
});

app.use((req, res, next) => {
    res.locals.currLoggedIn = req.cookies.loggedIn === 'true';
    next();
});

app.get('/dogCare', (req, res) => {
    const currLoggedIn = req.cookies.loggedIn === 'true';
    res.render("dogcare.ejs", {currLoggedIn});
});

app.get('/catCare', (req, res) => {
    const currLoggedIn = req.cookies.loggedIn === 'true';
    res.render("catcare.ejs", {currLoggedIn});
});

app.get('/contact', (req, res) => {
    const currLoggedIn = req.cookies.loggedIn === 'true';
    res.render("contact.ejs", {currLoggedIn});
});


app.get('/privacy', (req, res) => {
    const currLoggedIn = req.cookies.loggedIn === 'true';
    res.render("privacy.ejs", {currLoggedIn});
});


app.get('/login', (req, res) => {
    const currLoggedIn = req.cookies.loggedIn === 'true';
    let msg = '';
    let redBox = false;
    if(currLoggedIn){
        const username = req.cookies.username;
        res.render("successLogin.ejs", {msg, redBox, username, currLoggedIn});
    }
    else{
        res.render("login.ejs", {msg, redBox, currLoggedIn});
    }
});

app.get('/signup', (req, res) => {
    const currLoggedIn = req.cookies.loggedIn === 'true';
    let msg = '';
    let redBox = false;
    if(currLoggedIn){
        const username = req.cookies.username;
        res.render("successLogin.ejs", {msg, redBox, username, currLoggedIn});
    }
    else{
        res.render("signup.ejs", {msg, redBox, currLoggedIn});
    }
});

app.get('/logout', (req, res) => {
    res.clearCookie('loggedIn');
    res.clearCookie('username');
    req.session.destroy((err)=> {
        if(err){
            console.log("Error destroying");
        }
        else{
            res.redirect('/');
        }
    });
})

app.get('/find', (req, res) => {
    const currLoggedIn = req.cookies.loggedIn === 'true';
    let msg = '';
    let formInfo = {};
    let isFilled = true;
    res.render("find.ejs", { msg, formInfo, isFilled, currLoggedIn });
});


app.post('/find', (req, res) => {
    const currLoggedIn = req.cookies.loggedIn === 'true';
    let formInfo = req.body;
    let msg;
    let isFilled = true;
    let matchPets = [];
    let catCount = 0;
    let dogCount = 0;
    let petCount = 0;

    if (validatePetForm(formInfo)) {
        fs.readFile("./availablePets.txt", 'utf-8', function(err, data) {
            if (err) {
                throw err;
            }
            let petInfo = data.split("\n");
            for (var i = 0; i < petInfo.length; i++) { 
                if (petInfo[i].trim() !== '') {
                    let petData = petInfo[i].split(":");
                    if (
                        formInfo["typepet"] === petData[2] && 
                        formInfo["breed"] === petData[3] &&   
                        formInfo["ages"] === petData[4] &&    
                        formInfo["gender"] === petData[5] &&  
                        (formInfo["group"] === petData[6] || petData[6] === "none") 
                    ) {
                        matchPets.push(petData);
                    }
                    petCount++;
                }
            }
            for (var k = 0; k < matchPets.length; k++) {
                if (matchPets[k][2] === "cat") {
                    catCount++;
                } else if (matchPets[k][2] === "dog") {
                    dogCount++;
                }
            }
            res.render("pets2.ejs", {currLoggedIn, matchPets, catCount, dogCount, petCount });
        });        
    } else {
        isFilled = false;
        msg = "Please fill out all fields.";
        res.render("find.ejs", {msg, formInfo, isFilled, currLoggedIn });
    }
})

app.get('/giveaway', (req, res) => {
    const currLoggedIn = req.cookies.loggedIn === 'true';
    let msg = '';
    if(currLoggedIn){
        let formInfo = {};
        let isFilled = true;
        res.render("giveaway.ejs", {msg, formInfo, isFilled, currLoggedIn});
    }
    else{
        msg = "You have to log in first.";
        let redBox = true;
        res.render("login.ejs", {msg, redBox, currLoggedIn});
    }
})
app.post('/giveaway', (req, res) => {
    const currLoggedIn = req.cookies.loggedIn === 'true';
    let formInfo = req.body;
    let petData = req.body;
    let msg;
    let isFilled=true;

    if(req.body["email"].trim() === ''){
        isFilled=false;
        msg = "Please fill out all fields." 
        res.render("giveaway.ejs", {msg, formInfo, isFilled,currLoggedIn });
    }
    else if(validateEmail(req.body["email"])){
        if(validatePetForm(formInfo)){
            let typepet = petData["typepet"];
            let breed = petData["breed"];
            let age = petData["ages"];
            let gender = petData["gender"];
            let group = petData["group"];
            let comment = petData["comment"];
            let fullname = petData["fullname"];
            let email = petData["email"];
            msg='';
            formInfo = {};
            const username = req.cookies.username;
            fs.appendFile("availablePets.txt", `${id}:${username}:${typepet}:${breed}:${age}:${gender}:${group}:${comment}:${fullname}:${email}\n`, (err) => {
                if (err){throw err};
                id += 1;
            })
            res.render("giveaway.ejs", {msg, formInfo, isFilled, currLoggedIn});
        }
        else{
            isFilled=false;
            msg = "Please fill out all fields." 
            res.render("giveaway.ejs", {msg, formInfo, isFilled, currLoggedIn});
        }
    }
    else{
        if(validatePetForm(formInfo)){
            isFilled=false;
            msg='Please enter a valid email address.';
            res.render("giveaway.ejs", {msg, formInfo, isFilled, currLoggedIn});
        }
        else{
            isFilled=false;
            msg = "Please fill out all fields and enter a valid email address." 
            res.render("giveaway.ejs", {msg, formInfo, isFilled, currLoggedIn});
        }
    }
})


app.post("/login", (req, res) => {
    let formInfo = req.body;
    let username = formInfo["username"];
    let password = formInfo["password"];
    let accountExists = false;
    let msg = '';
    let goodPassword = '';
    let redBox = false;
    fs.readFile("./login.txt", 'utf-8', function(err, data) {
        if(err){throw err};
        let userInfo = data.split("\n");
        for(var i = 0; i<userInfo.length; i++){
            userInfo[i] = userInfo[i].split(":");
        }
        for(var j = 0; j<userInfo.length; j++){
            if(userInfo[j][0] == username){
                accountExists = true;
                goodPassword = userInfo[j][1]
                break;
            }
        }
        if(accountExists){
            if(password == goodPassword){
                req.session.username = username;
                res.cookie("loggedIn", true);
                res.cookie("username", username);
                res.render("successLogin.ejs", {msg, redBox, username, currLoggedIn: true});
            }
            else{
                msg = "Wrong password. Try again!"
                redBox = true;
                const currLoggedIn = req.cookies.loggedIn === 'true';
                res.render("login.ejs", {msg, redBox, currLoggedIn});
            }
        }
        else{
            msg = "This account username does not exist. Please create an account."
            redBox = true;
            const currLoggedIn = req.cookies.loggedIn === 'true';
            res.render("login.ejs", {msg, redBox, currLoggedIn});
        }
    })
})

app.post("/signUp", (req, res) => {
    const currLoggedIn = req.cookies.loggedIn === 'true';
    let formInfo = req.body;
    let username = formInfo["username"];
    let password = formInfo["password"];
    let Taken = false;
    let msg = '';
    let redBox = false;
    fs.readFile("./login.txt", 'utf-8', function(err, data) {
        if(err){throw err};
        if(data.includes(username)){
            Taken = true;
        }
        if(Taken){
            msg = "This username is not available. Please try again."
            redBox = true;
            res.render("signUp.ejs", {msg, redBox, currLoggedIn});
        }
        else{
            fs.appendFile("login.txt", `${username}:${password}\n`, (err) => {
                if (err){throw err};
            })
            res.render("successSignup.ejs", {msg, redBox, currLoggedIn, username});
        }
    })
})


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})
