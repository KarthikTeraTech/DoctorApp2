const getCurrentDate = (date)=>{
    let currDate = "";
    let d = date? new Date(date) : new Date();

    const dt = d.getDate();
    const month = d.getMonth()+1;
    const year = d.getFullYear();

    currDate = `${dt}-${month}-${year}`;
    return currDate;
}

const getCurrentTime = (time)=>{
    let currTime = "";
    let t = time? new Date(time) : new Date();

    const hours = t.getHours();
    const minutes = t.getMinutes();

    currTime = `${hours}:${minutes}`;
    return currTime;
}

const getDayMode = ()=>{
    let currTime = "";
    let d = new Date();

    const hours = d.getHours();

    return hours >= 16 ? "evening" : "morning";
}

export {getCurrentDate, getCurrentTime, getDayMode};