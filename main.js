let data = {
    indigon: true,
    indigonRange: 50,
    extraManaSpent: 0, 
    increasedMana: 0,
    moreMana: 0,
    mana: 6000,
    duration: 10,
    skills: [
        {cost: 30, speed: 1}
    ]
};
let history = [];

function updateSkills(){//takes skills input and update state
    document.querySelectorAll(".skill-wrapper").forEach(i =>{
        data.skills[i.dataset.index].cost = validateInputAsNumber(i.querySelector(".cost"))
        data.skills[i.dataset.index].speed = validateInputAsNumber(i.querySelector(".speed"))
    })
}
function removeSkill(key){
    updateSkills();
    data.skills.splice(key, 1);
    renderSkill();
}
function addSkill(){
    updateSkills();
    if(data.skills.length > 20){
        return console.log("too many skills")
    }
    data.skills.push({cost: 30, speed: 1});
    renderSkill();
}
function renderSkill(){//renders skill via state
    const wrapper = document.querySelector("#skills-container")

    const html = data.skills.map((i, index) => {
        const primarySkill = index === 0 ? "" : `<button class="removeSkill" onclick="removeSkill(${index})">X</button>`;
        return `
        <div class="skill-wrapper skill_${index}" data-index="${index}">
            <h4>Skill ${index+1}</h6>
            <label for="skill_${index}">Mana cost:</label>
            <input type="number" value="${i.cost}" class="cost" data-index="${index}" id="skill_${index}" placeholder="Base mana cost">
            <label for="skill_${index}_speed">Use per second:</label>
            <input type="number"value="${i.speed}" max="500" class="speed" data-index="${index}" id="skill_${index}_speed" placeholder="# of uses per second">
            ${primarySkill}
        </div>
        `

    });
    wrapper.innerHTML = html.join('')
    wrapper.querySelectorAll("input").forEach(i =>{
        i.addEventListener("focus", ()=> i.select())
    })
}
function convertUseSpeed(useSpeed){
    return (1 / useSpeed).toFixed(2) * 1000; //attack in ms
}
function handleManaCalc(cost, increased){//calculates total increased from indigon and recent mana spent
    return Math.floor(cost * (increased + 100) / 100);
}
function getMana(manaCost, currentTick){//takes the history: [[{skill, cost}], [{skill, cost}]...] where each element is 100ms
    let accumulator = 0;
    for(let i = history.length - 1; i > history.length - 40; i--){//accumlate recent mana spent
        if(i <0){
            break;
        }
        if(history[i].length === 0){
            continue;
        }
        history[i].forEach(o => {
            accumulator += o.cost;
        })
    }
    currentTick.forEach(i => accumulator += i.cost) //get current mana spent in past 100ms

    const percentageIncreased = data.indigon ? data.increasedMana + 
       (Math.floor(accumulator / 200) * data.indigonRange) :
        data.increasedMana;
    return {
        cost: handleManaCalc(handleManaCalc(manaCost, percentageIncreased), data.moreMana),
        recentSpent: accumulator
    }; 
}
function validateInputAsNumber(elem){
    const response = +elem.value;
    if(isNaN(response)){
        return 0;
    }
    else return response;
}
function handleData(){
    history = [];
    document.querySelectorAll(".options-container input").forEach(i => {
        data[i.id] = validateInputAsNumber(i)
    })
    data.indigon = document.querySelector("#indigon").checked
    data.indigonRange = validateInputAsNumber(document.querySelector("#indigonRange"))

    data.duration = validateInputAsNumber(document.querySelector("#duration"))
    updateSkills();
}
function displayData(arr){
    let stripe = true;

    let skillsHTML = arr.map((i, index) =>{
        if(i.length === 0){
            return null
        }
        return i.map((a, index2)=>{
            if(index === 0){
                return  `
                <tr class=${stripe ? "stripe" : "noStripe"}>
                    <td rowspan="1">${(index * 0.1).toFixed(1)}</td>
                    <td>Extra spent</td>
                    <td>${a.cost}</td>
                    <td>${a.recent}</td>
                </tr>
                `
            }
            if(index2 === 0){
                stripe = !stripe;
                return  `
            <tr class=${stripe ? "stripe" : "noStripe"}>
                <td rowspan="${i.length}">${(index * 0.1).toFixed(1)}</td>
                <td class="skill_${a.skill}">Skill ${a.skill+1}</td>
                <td class="skill_${a.skill}">${a.cost}</td>
                <td>${a.recent}</td>
            </tr>
            `
            }
            else {
            return `
            <tr class=${stripe ? "stripe" : "noStripe"}>
                <td class="skill_${a.skill}">Skill ${a.skill+1}</td>
                <td class="skill_${a.skill}">${a.cost}</td>
                <td>${a.recent}</td>
            </tr>
        `
        }
        }).join('');
    });
    skillsHTML = skillsHTML.join('')

    const html = `<table>
    <tr>
      <th>Time (seconds)</th>
      <th>Skills</th>
      <th>Cost</th>
      <th>Recent Mana Spent</th>
    </tr>
    ${skillsHTML}
    </table>
    `
    document.querySelector("#data-display").innerHTML = html;

}
function handleCalc(){
    handleData();
    const skillsData = data.skills.map(i =>{
        return {cost: i.cost, speedInMs: convertUseSpeed(i.speed)}
    });
    const simulationTime = data.duration
    const simulationTimeMS = simulationTime * 1000

    for(let tick=0 ; tick < simulationTimeMS; tick+= 100){
        let tempHistory = []
        if(tick === 0){
            const cost1 = handleManaCalc(
                handleManaCalc(data.extraManaSpent, data.increasedMana),
                data.moreMana
            );
            tempHistory.push({skill: "extra", cost: cost1, recent: cost1})
        }

        skillsData.forEach((i, index) => {
            let startCount = Math.floor(tick / i.speedInMs)
            let finishCount = Math.floor((tick + 100) / i.speedInMs)
            for(let skillUse = startCount; skillUse < finishCount; skillUse++){
                const skillInfo = getMana(i.cost, tempHistory)
                tempHistory.push({skill: index, cost: skillInfo.cost, recent: skillInfo.recentSpent + skillInfo.cost})
            }
        })
        history.push(tempHistory);
    }
    displayData(history)
};

document.querySelectorAll("input[type=number]").forEach(element => {
    element.addEventListener("focus", function() {
        element.select(); 
      });
});
const slider = document.querySelector("#indigonRange")
slider.addEventListener("input", ()=>{
    document.querySelector("#indigonRangeText").textContent = `${slider.value}% increased Cost of Skills for each 200 total Mana Spent Recently`
})
window.addEventListener("DOMContentLoaded", ()=>{
    renderSkill();
    document.querySelector("#indigonRangeText").textContent = `${slider.value}% increased Cost of Skills for each 200 total Mana Spent Recently`
})
document.querySelector("#calculate").addEventListener("click", ()=>handleCalc())//handles calculation