module.exports = {
    
    formatPhoneNumber: (phone_number) => {
        if (phone_number && phone_number.startsWith('0')) {
            phone_number = '+233' + phone_number.substr(1);
        } else if(phone_number && phone_number.startsWith('233')){
            phone_number = '+233' + phone_number.substr(3);
        }
        return phone_number;
    },
    isValidDate(dateObject)
    {
        return new Date(dateObject).toString() !== 'Invalid Date';
    },
    trimDate(the_date)
    {
        return new Date(the_date).toLocaleDateString();
    },
    isValidEmail(email)
    {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email);
    }
};