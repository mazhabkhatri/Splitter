// =====================================
// SPLITMATE APP JAVASCRIPT
// PART 1/4
// =====================================


// =====================================
// SCREEN ELEMENTS
// =====================================

const homeScreen = document.getElementById("homeScreen");
const tripScreen = document.getElementById("tripScreen");
const dashboardScreen = document.getElementById("dashboardScreen");




// =====================================
// BUTTONS
// =====================================

const newTripBtn = document.getElementById("newTripBtn");
const savedTripsBtn = document.getElementById("savedTripsBtn");

const createTripBtn = document.getElementById("createTripBtn");





// =====================================
// TRIP INPUTS
// =====================================

const tripNameInput = document.getElementById("tripName");
const tripDescriptionInput = document.getElementById("tripDescription");
const tripDateInput = document.getElementById("tripDate");





// =====================================
// DASHBOARD
// =====================================

const dashboardTitle = document.getElementById("dashboardTitle");
const dashboardSubtitle = document.getElementById("dashboardSubtitle");





// =====================================
// LOCAL STORAGE DATA
// =====================================


let currentTrip = null;
let allTrips = [];


// Load Current Trip Safely
try {

    const savedTrip = localStorage.getItem("currentTrip");

    if(savedTrip){

        currentTrip = JSON.parse(savedTrip);

    }

}
catch(error){

    console.log("Corrupted currentTrip data removed");

    localStorage.removeItem("currentTrip");

    currentTrip = null;

}



// Load All Trips Safely
try {

    const savedTrips = localStorage.getItem("allTrips");

    if(savedTrips){

        allTrips = JSON.parse(savedTrips);

    }

}
catch(error){

    console.log("Corrupted allTrips data removed");

    localStorage.removeItem("allTrips");

    allTrips = [];

}






// =====================================
// CREATE EMPTY TRIP
// =====================================


function createEmptyTrip(name,description,date){


return {


id:Date.now(),


name:name,


description:description,


date:date,


members:[],


expenses:[]



};


}








// =====================================
// SCREEN CONTROL
// =====================================


function showScreen(screen){


homeScreen.classList.add("hidden");

tripScreen.classList.add("hidden");

dashboardScreen.classList.add("hidden");



screen.classList.remove("hidden");



}








// =====================================
// GO HOME FUNCTION
// =====================================


function goHome(){


showScreen(homeScreen);


}








// =====================================
// NEW TRIP BUTTON
// =====================================


if(newTripBtn){


newTripBtn.addEventListener(
"click",
()=>{


showScreen(tripScreen);


}

);


}









// =====================================
// CREATE TRIP
// =====================================


if(createTripBtn){



createTripBtn.addEventListener(
"click",
()=>{



let name =
tripNameInput.value.trim();



let description =
tripDescriptionInput.value.trim();



let date =
tripDateInput.value;





if(name===""){


alert("Please enter trip name");


return;


}






currentTrip =
createEmptyTrip(
name,
description,
date
);






localStorage.setItem(
"currentTrip",
JSON.stringify(currentTrip)
);






dashboardTitle.innerHTML =
name;



dashboardSubtitle.innerHTML =
description ||
"Manage your expenses";






showScreen(dashboardScreen);





updateDashboardStats();






}

);



}









// =====================================
// UPDATE DASHBOARD STATS
// =====================================


function updateDashboardStats(){


if(!currentTrip)return;




const totalMembers =
document.getElementById(
"totalMembers"
);



const totalExpense =
document.getElementById(
"totalExpense"
);



if(totalMembers){


totalMembers.innerText =
currentTrip.members.length;


}





let amount = 0;



currentTrip.expenses.forEach(
(expense)=>{


amount += Number(expense.amount);


}

);




if(totalExpense){


totalExpense.innerText =
"₹"+amount;


}





}








// =====================================
// LOAD EXISTING TRIP
// =====================================


function loadTrip(){



if(currentTrip){



dashboardTitle.innerHTML =
currentTrip.name;



dashboardSubtitle.innerHTML =
currentTrip.description ||
"Manage your expenses";



showScreen(dashboardScreen);



updateDashboardStats();



}



}






// Load when app opens

loadTrip();
// =====================================
// PART 2/4
// MEMBER MANAGEMENT
// =====================================





// =====================================
// MEMBER ELEMENTS
// =====================================


const memberNameInput =
document.getElementById("memberName");


const addMemberBtn =
document.getElementById("addMemberBtn");


const memberList =
document.getElementById("memberList");


const memberCount =
document.getElementById("memberCount");









// =====================================
// SAVE CURRENT TRIP
// =====================================


function saveCurrentTrip(){


localStorage.setItem(
"currentTrip",
JSON.stringify(currentTrip)
);


}










// =====================================
// ADD MEMBER
// =====================================


if(addMemberBtn){



addMemberBtn.addEventListener(
"click",
()=>{



let name =
memberNameInput.value.trim();





if(name===""){


alert("Enter member name");


return;


}





if(
currentTrip.members.includes(name)
){


alert("Member already exists");


return;


}







currentTrip.members.push(name);



saveCurrentTrip();




memberNameInput.value="";



renderMembers();



updateDashboardStats();



}

);


}










// =====================================
// DISPLAY MEMBERS
// =====================================


function renderMembers(){



if(!memberList || !currentTrip)
return;





memberList.innerHTML="";





if(currentTrip.members.length===0){



memberList.innerHTML=`

<div class="empty-state">

<div class="empty-icon">

<i data-lucide="users"></i>

</div>


<h3>
No Members
</h3>


<p>
Add participants to start.
</p>


</div>

`;



lucide.createIcons();



return;



}









currentTrip.members.forEach(
(member,index)=>{





let firstLetter =
member.charAt(0).toUpperCase();







memberList.innerHTML += `



<div class="member-card">



<div class="avatar">


${firstLetter}


</div>





<div class="member-info">


<h4>
${member}
</h4>


<p>
Participant
</p>


</div>







<button
class="icon-btn"
onclick="editMember(${index})">


<i data-lucide="edit-3"></i>


</button>






<button
class="icon-btn"
onclick="deleteMember(${index})">


<i data-lucide="trash-2"></i>


</button>





</div>


`;






}

);






lucide.createIcons();






if(memberCount){


memberCount.innerText =
currentTrip.members.length+
" Members";


}




}









// =====================================
// DELETE MEMBER
// =====================================


window.deleteMember =
function(index){



let confirmDelete =
confirm(
"Remove this member?"
);





if(!confirmDelete)
return;





currentTrip.members.splice(
index,
1
);




saveCurrentTrip();



renderMembers();



updateDashboardStats();



}










// =====================================
// EDIT MEMBER
// =====================================


window.editMember =
function(index){



let oldName =
currentTrip.members[index];



let newName =
prompt(
"Edit member name",
oldName
);





if(newName===null)
return;





newName =
newName.trim();





if(newName===""){

alert(
"Name cannot be empty"
);


return;

}





if(
currentTrip.members.includes(newName)
&&
newName!==oldName
){


alert(
"Member already exists"
);


return;


}






currentTrip.members[index]=newName;




saveCurrentTrip();



renderMembers();




}









// =====================================
// LOAD MEMBERS WHEN DASHBOARD OPENS
// =====================================


if(currentTrip){


renderMembers();


}
// =====================================
// PART 3/4
// EXPENSE MANAGEMENT
// =====================================





// =====================================
// EXPENSE ELEMENTS
// =====================================


const addExpenseBtn =
document.getElementById("addExpenseBtn");


const expenseForm =
document.getElementById("expenseForm");


const closeExpenseFormBtn =
document.getElementById("closeExpenseFormBtn");


const cancelExpenseBtn =
document.getElementById("cancelExpenseBtn");


const saveExpenseBtn =
document.getElementById("saveExpenseBtn");





const expenseTitle =
document.getElementById("expenseTitle");


const expenseAmount =
document.getElementById("expenseAmount");


const expensePaidBy =
document.getElementById("expensePaidBy");


const expenseCategory =
document.getElementById("expenseCategory");


const expenseDate =
document.getElementById("expenseDate");


const expenseDescription =
document.getElementById("expenseDescription");





const expenseList =
document.getElementById("expenseList");



const expenseTotal =
document.getElementById("expenseTotal");


const expenseCount =
document.getElementById("expenseCount");










// =====================================
// OPEN EXPENSE FORM
// =====================================


if(addExpenseBtn){


addExpenseBtn.onclick = ()=>{


expenseForm.classList.remove("hidden");


loadExpenseMembers();


};


}







// =====================================
// CLOSE EXPENSE FORM
// =====================================


function closeExpenseForm(){


expenseForm.classList.add("hidden");


clearExpenseInputs();


}



if(closeExpenseFormBtn){


closeExpenseFormBtn.onclick =
closeExpenseForm;


}



if(cancelExpenseBtn){


cancelExpenseBtn.onclick =
closeExpenseForm;


}









// =====================================
// CATEGORY SELECTION
// =====================================


const categoryButtons =
document.querySelectorAll(
".category-btn"
);




categoryButtons.forEach(
button=>{


button.onclick=()=>{


categoryButtons.forEach(
btn=>
btn.classList.remove("active")
);



button.classList.add("active");



expenseCategory.value =
button.dataset.category;



};



}

);









// =====================================
// LOAD MEMBERS IN SELECT
// =====================================


function loadExpenseMembers(){


if(!expensePaidBy)
return;



expensePaidBy.innerHTML=`

<option value="">
Select member
</option>

`;





currentTrip.members.forEach(
member=>{


expensePaidBy.innerHTML += `

<option value="${member}">
${member}
</option>

`;


}

);


}









// =====================================
// SAVE EXPENSE
// =====================================


if(saveExpenseBtn){



saveExpenseBtn.onclick=()=>{





let title =
expenseTitle.value.trim();


let amount =
Number(expenseAmount.value);


let paidBy =
expensePaidBy.value;



if(title===""){


alert(
"Enter expense title"
);


return;


}



if(amount<=0){


alert(
"Enter valid amount"
);


return;


}



if(paidBy===""){


alert(
"Select payer"
);


return;


}







let expense = {



id:Date.now(),


title:title,


amount:amount,


paidBy:paidBy,


category:
expenseCategory.value,


date:
expenseDate.value ||
new Date().toISOString().slice(0,10),


description:
expenseDescription.value



};






currentTrip.expenses.push(expense);



saveCurrentTrip();



renderExpenses();



updateDashboardStats();



closeExpenseForm();





};



}










// =====================================
// CLEAR FORM
// =====================================


function clearExpenseInputs(){



expenseTitle.value="";

expenseAmount.value="";

expensePaidBy.value="";

expenseDescription.value="";


}









// =====================================
// DISPLAY EXPENSES
// =====================================


function renderExpenses(){



if(!expenseList || !currentTrip)
return;





expenseList.innerHTML="";





if(currentTrip.expenses.length===0){



expenseList.innerHTML=`

<div class="empty-state">


<div class="empty-icon">

<i data-lucide="receipt"></i>

</div>


<h3>
No Expenses Yet
</h3>


<p>
Add your first expense.
</p>


</div>


`;



lucide.createIcons();



return;


}










let total=0;




currentTrip.expenses.forEach(
expense=>{



total += Number(expense.amount);







expenseList.innerHTML += `



<div class="expense-card">





<div class="expense-left">


<div class="expense-category">


<i data-lucide="wallet"></i>


</div>




<div>


<h4>
${expense.title}
</h4>


<p>
${expense.paidBy}
paid • ${expense.category}
</p>



</div>


</div>







<div class="expense-right">


<h3>
₹${expense.amount}
</h3>



<button
class="icon-btn"
onclick="deleteExpense(${expense.id})">


<i data-lucide="trash"></i>


</button>


</div>





</div>


`;



}

);







if(expenseTotal){


expenseTotal.innerText =
"₹"+total;


}




if(expenseCount){


expenseCount.innerText =
currentTrip.expenses.length;


}





lucide.createIcons();




}











// =====================================
// DELETE EXPENSE
// =====================================


window.deleteExpense =
function(id){



currentTrip.expenses =
currentTrip.expenses.filter(
expense =>
expense.id!==id
);





saveCurrentTrip();



renderExpenses();



updateDashboardStats();



}









// LOAD EXPENSES

if(currentTrip){


renderExpenses();


}
// =====================================
// PART 4/4
// SUMMARY + SETTLEMENT + SAVED TRIPS
// =====================================





// =====================================
// SUMMARY ELEMENTS
// =====================================


const summaryTotalExpense =
document.getElementById("summaryTotalExpense");


const averageExpense =
document.getElementById("averageExpense");


const highestExpense =
document.getElementById("highestExpense");


const memberSummaryList =
document.getElementById("memberSummaryList");





const settlementList =
document.getElementById("settlementList");










// =====================================
// UPDATE SUMMARY
// =====================================


function updateSummary(){



if(!currentTrip)
return;





let expenses =
currentTrip.expenses;




let total = 0;


let highest = 0;



expenses.forEach(expense=>{


total += Number(expense.amount);



if(expense.amount > highest){

highest = expense.amount;

}


});







if(summaryTotalExpense){


summaryTotalExpense.innerText =
"₹"+total;


}





if(averageExpense){


let avg =
expenses.length
?
Math.round(total/expenses.length)
:
0;



averageExpense.innerText =
"₹"+avg;


}





if(highestExpense){


highestExpense.innerText =
"₹"+highest;


}






renderMemberBalance();



}









// =====================================
// MEMBER BALANCE CALCULATION
// =====================================


function renderMemberBalance(){


if(!memberSummaryList)
return;




memberSummaryList.innerHTML="";




let total =
currentTrip.expenses.reduce(
(sum,e)=>
sum+Number(e.amount),
0
);





let share =
currentTrip.members.length
?
total/currentTrip.members.length
:
0;







currentTrip.members.forEach(member=>{



let paid =
currentTrip.expenses
.filter(
e=>e.paidBy===member
)
.reduce(
(sum,e)=>
sum+Number(e.amount),
0
);





let balance =
paid-share;







memberSummaryList.innerHTML += `


<div class="balance-card">


<div>


<h4>
${member}
</h4>


<p>
Paid: ₹${paid}
</p>


</div>




<strong>

${balance>=0?"+":"-"}
₹${Math.abs(Math.round(balance))}

</strong>



</div>


`;





});




}









// =====================================
// SETTLEMENT CALCULATION
// =====================================


function updateSettlement(){



if(!settlementList)
return;



settlementList.innerHTML="";




let balances=[];




let total =
currentTrip.expenses.reduce(
(sum,e)=>
sum+Number(e.amount),
0
);



let share =
currentTrip.members.length
?
total/currentTrip.members.length
:
0;






currentTrip.members.forEach(member=>{


let paid =
currentTrip.expenses
.filter(
e=>e.paidBy===member
)
.reduce(
(sum,e)=>
sum+Number(e.amount),
0
);




balances.push({

name:member,

amount:
Math.round(paid-share)

});



});






let creditors =
balances.filter(
b=>b.amount>0
);



let debtors =
balances.filter(
b=>b.amount<0
);







if(creditors.length===0){


settlementList.innerHTML=`


<div class="empty-state">

<h3>
Everything settled 🎉
</h3>

</div>


`;

return;


}








debtors.forEach(debtor=>{



creditors.forEach(creditor=>{



if(
debtor.amount===0
||
creditor.amount===0
)
return;





let amount =
Math.min(
Math.abs(debtor.amount),
creditor.amount
);





settlementList.innerHTML += `


<div class="settlement-card">


<strong>
${debtor.name}
</strong>


<span>
pays
</span>


<strong>
${creditor.name}
</strong>


<b>
₹${amount}
</b>



</div>


`;






debtor.amount += amount;


creditor.amount -= amount;



});



});





}









// =====================================
// SAVED TRIPS
// =====================================


const savedTripsModal =
document.getElementById(
"savedTripsModal"
);



const savedTripsList =
document.getElementById(
"savedTripsList"
);



const closeSavedTripsBtn =
document.getElementById(
"closeSavedTripsBtn"
);






if(savedTripsBtn){



savedTripsBtn.onclick=()=>{



saveCurrentTripToList();


showSavedTrips();


};


}









function saveCurrentTripToList(){



if(!currentTrip)
return;



let exists =
allTrips.find(
trip=>trip.id===currentTrip.id
);



if(!exists){



allTrips.push(currentTrip);



localStorage.setItem(
"allTrips",
JSON.stringify(allTrips)
);



}



}









function showSavedTrips(){



savedTripsModal.classList.remove(
"hidden"
);



savedTripsList.innerHTML="";





if(allTrips.length===0){



savedTripsList.innerHTML=`

<div class="empty-state">

<h3>
No Saved Trips
</h3>

</div>


`;

return;


}






allTrips.forEach(trip=>{



savedTripsList.innerHTML += `



<div class="saved-trip-card">


<h3>
${trip.name}
</h3>


<p>
${trip.members.length} members
</p>



<button
onclick="openSavedTrip(${trip.id})"
class="primary-small-btn">

Open

</button>



</div>


`;



});





}









window.openSavedTrip=function(id){



let trip =
allTrips.find(
t=>t.id===id
);



if(!trip)
return;



currentTrip=trip;



saveCurrentTrip();



dashboardTitle.innerText =
currentTrip.name;



showScreen(dashboardScreen);



renderMembers();


renderExpenses();


updateSummary();


updateSettlement();


};










if(closeSavedTripsBtn){


closeSavedTripsBtn.onclick=()=>{


savedTripsModal.classList.add(
"hidden"
);


};


}









// =====================================
// TAB CONNECTIONS
// =====================================


membersTab.onclick=()=>{


showDashboardSection(
"membersSection"
);


};



expensesTab.onclick=()=>{


showDashboardSection(
"expensesSection"
);


};



summaryTab.onclick=()=>{


showDashboardSection(
"summarySection"
);


updateSummary();


};



settlementTab.onclick=()=>{


showDashboardSection(
"settlementSection"
);


updateSettlement();


};










function showDashboardSection(id){



document
.querySelectorAll(".dashboard-section")
.forEach(section=>{


section.classList.add("hidden");


});



document
.getElementById(id)
.classList.remove("hidden");



}









// =====================================
// FINAL LOAD
// =====================================


if(currentTrip){


renderMembers();


renderExpenses();


updateSummary();


updateSettlement();


}





lucide.createIcons();