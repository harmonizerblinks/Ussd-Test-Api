module.exports = {
    
    formatPhoneNumber: (phone_number) => {
        if (phone_number && phone_number.startsWith('0')) {
            phone_number = '+233' + phone_number.substr(1);
        } else if(phone_number && phone_number.startsWith('233')){
            phone_number = '+233' + phone_number.substr(3);
        }
        return phone_number;
    },

};