module.exports = {
    ValRegUser: (user) => {
        const regex = new RegExp("[^a-zA-Z0-9-_~]", "g");
        if (!user) return false;
        if (!user.username) return false;
        if (!user.password) return false;
        if (!user.email) return false;
        if (typeof user !== "object") return false;
        if (typeof user.username !== "string") return false;
        if (typeof user.password !== "string") return false;
        if (typeof user.email !== "string") return false;
        if (user.username.length >= 25) return false;
        if (user.password.length >= 100) return false;
        if (user.email.length >= 40) return false;
        if (user.username.match(regex) && user.username.match(regex).length > 0) return false;
          
        // var ap = /'/g, 
        // ic = /"/g;
        // user.username = user.username.toString().replace(ap, "&#39;").replace(ic, "&#34;"); 
        // user.email = user.email.toString().replace(ap, "&#39;").replace(ic, "&#34;"); 
        
        return user
    },
    ValLogUser: (user) => {
        const regex = new RegExp("[^a-zA-Z0-9-_~]", "g");
        if (!user) return false;
        if (!user.username) return false;
        if (!user.password) return false;
        if (typeof user !== "object") return false;
        if (typeof user.username !== "string") return false;
        if (typeof user.password !== "string") return false;
        if (user.username.length >= 25) return false;
        if (user.password.length >= 100) return false;
        if (user.username.match(regex) && user.username.match(regex).length > 0) return false;

        // var ap = /'/g, 
        // ic = /"/g;
        // user.username = user.username.toString().replace(ap, "&#39;").replace(ic, "&#34;"); 
        // user.email = user.email.toString().replace(ap, "&#39;").replace(ic, "&#34;"); 

        return user
    }
}