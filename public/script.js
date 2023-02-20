function getCookie(name) {
    // Split cookie string and get all individual name=value pairs in an array
    var cookieArr = document.cookie.split(";");
    
    // Loop through the array elements
    for(var i = 0; i < cookieArr.length; i++) {
        var cookiePair = cookieArr[i].split("=");
        
        /* Removing whitespace at the beginning of the cookie name
        and compare it with the given string */
        if(name == cookiePair[0].trim()) {
            // Decode the cookie value and return
            return decodeURIComponent(cookiePair[1]);
        }
    }
    
    // Return null if not found
    return null;
}

function removeCookie(name) {
    document.cookie = name + "=; max-age=0";
}

(async () => {

    async function checkCookie() {
        let valtoken = await fetch("/api/validate", {
            method: "POST",
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          })
          // console.log(await post.json())
        let result = await valtoken.json()
        return result.status
    }

    console.log(getCookie("zeonsession"))
    if (getCookie("zeonsession")){
        let cc = await checkCookie()
        console.log(cc == 200)
        if (cc) {
            let profile = document.querySelector(".nav").querySelector(".profile")
            profile.style.display = "flex"
            profile.querySelector("#pfp").src = JSON.parse(atob(getCookie("zeonsession"))).info.pfp
            profile.querySelector("#un").innerHTML = JSON.parse(atob(getCookie("zeonsession"))).info.user
        } else {
            location.pathname = "/login"
        }
        setInterval(async () => {
            let cc = await checkCookie()
            console.log(cc)
            if (cc == 200) {
                let profile = document.querySelector(".nav").querySelector(".profile")
                profile.style.display = "flex"
                profile.querySelector("#pfp").src = JSON.parse(atob(getCookie("zeonsession"))).info.pfp
                profile.querySelector("#un").innerHTML = JSON.parse(atob(getCookie("zeonsession"))).info.user
            } else {
                console.log(cc)
                location.pathname = "/login"
            }
        }, 10000)
    }
})()