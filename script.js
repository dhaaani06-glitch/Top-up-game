const gamesData=[
 {name:"Mobile Legends",icon:"⚔️",items:[["86 Diamonds",20000],["172 Diamonds",39000],["257 Diamonds",57000],["344 Diamonds",76000],["514 Diamonds",110000]]},
 {name:"Free Fire",icon:"🔥",items:[["70 Diamonds",10000],["140 Diamonds",19000],["355 Diamonds",48000],["720 Diamonds",95000],["1450 Diamonds",185000]]},
 {name:"PUBG Mobile",icon:"🔫",items:[["60 UC",16000],["325 UC",75000],["660 UC",145000],["1800 UC",370000]]},
 {name:"Valorant",icon:"🎯",items:[["125 Points",15000],["420 Points",50000],["700 Points",80000],["1375 Points",150000]]},
 {name:"Genshin Impact",icon:"✨",items:[["60 Genesis",16000],["330 Genesis",79000],["1090 Genesis",245000],["2240 Genesis",490000]]},
 {name:"Honor of Kings",icon:"👑",items:[["80 Tokens",15000],["240 Tokens",45000],["400 Tokens",72000],["800 Tokens",140000]]},
 {name:"Roblox",icon:"🧱",items:[["80 Robux",16000],["400 Robux",70000],["800 Robux",135000],["1700 Robux",275000]]},
 {name:"Honkai: Star Rail",icon:"🚆",items:[["60 Oneiric",16000],["330 Oneiric",79000],["1090 Oneiric",245000],["2240 Oneiric",490000]]}
];

const money=n=>"Rp"+Number(n).toLocaleString("id-ID");
const getOrders=()=>JSON.parse(localStorage.getItem("topup_orders")||"[]");
const saveOrders=o=>localStorage.setItem("topup_orders",JSON.stringify(o));

function renderGames(filter=""){
 const box=document.getElementById("games"); if(!box)return;
 box.innerHTML=gamesData.filter(g=>g.name.toLowerCase().includes(filter.toLowerCase())).map((g,i)=>
 `<div class="game" onclick="openTopup(${i})"><div class="game-icon">${g.icon}</div><h3>${g.name}</h3><p>Mulai ${money(g.items[0][1])}</p></div>`).join("");
}
function openTopup(i){
 const g=gamesData[i]; document.getElementById("modal").classList.remove("hidden");
 document.getElementById("modalGame").textContent=g.name;
 document.getElementById("game").value=g.name;
 document.getElementById("nominal").innerHTML=g.items.map((x)=>`<option value="${x[0]}|${x[1]}">${x[0]} — ${money(x[1])}</option>`).join("");
}
function closeModal(){document.getElementById("modal").classList.add("hidden")}
document.addEventListener("DOMContentLoaded",()=>{
 renderGames(); renderOrders();
 const search=document.getElementById("searchGame"); if(search)search.oninput=e=>renderGames(e.target.value);
 const form=document.getElementById("orderForm");
 if(form)form.onsubmit=async e=>{
   e.preventDefault();
   const file=document.getElementById("proof").files[0];
   if(!file)return;
   const reader=new FileReader();
   reader.onload=()=>{
    const [nominal,price]=document.getElementById("nominal").value.split("|");
    const orders=getOrders();
    orders.unshift({id:"TP"+Date.now().toString().slice(-7),date:new Date().toLocaleString("id-ID"),game:document.getElementById("game").value,nominal,userId:document.getElementById("userId").value,zoneId:document.getElementById("zoneId").value,buyer:document.getElementById("buyerName").value,wa:document.getElementById("whatsapp").value,price:Number(price),proof:reader.result,status:"Menunggu Verifikasi"});
    saveOrders(orders); form.reset(); closeModal(); renderOrders(); alert("Pesanan berhasil dikirim. Simpan nomor pesanan untuk pengecekan.");
    location.hash="orders";
   }; reader.readAsDataURL(file);
 };
});
function renderOrders(){
 const box=document.getElementById("orderList");if(!box)return;
 const orders=getOrders();
 box.innerHTML=orders.length?orders.slice(0,10).map(o=>`<div class="order"><div><b>${o.game} — ${o.nominal}</b><br><small>${o.id} · ${o.date}</small></div><span class="status ${o.status==="Terverifikasi"?"success":o.status==="Ditolak"?"rejected":""}">${o.status}</span></div>`).join(""):"<div class='order'>Belum ada pesanan.</div>";
}
function renderAdmin(){
 const box=document.getElementById("adminOrders"),stats=document.getElementById("stats");if(!box)return;
 const orders=getOrders(),pending=orders.filter(x=>x.status==="Menunggu Verifikasi").length,done=orders.filter(x=>x.status==="Terverifikasi").length;
 stats.innerHTML=`<div class="stat">Total Pesanan<b>${orders.length}</b></div><div class="stat">Menunggu<b>${pending}</b></div><div class="stat">Terverifikasi<b>${done}</b></div>`;
 box.innerHTML=orders.length?orders.map(o=>`<article class="admin-order">
 <div class="order-head"><div><b>${o.id}</b><br><strong>${o.game} — ${o.nominal}</strong></div><span class="status ${o.status==="Terverifikasi"?"success":o.status==="Ditolak"?"rejected":""}">${o.status}</span></div>
 <div class="order-info"><div><b>Pembeli</b><br>${o.buyer}</div><div><b>ID / Zone</b><br>${o.userId} / ${o.zoneId||"-"}</div><div><b>Total</b><br>${money(o.price)}<br>${o.wa}</div></div>
 <img class="proof" src="${o.proof}" alt="Bukti transfer">
 ${o.status==="Menunggu Verifikasi"?`<div class="actions"><button class="approve" onclick="updateStatus('${o.id}','Terverifikasi')">✓ Verifikasi</button><button class="reject" onclick="updateStatus('${o.id}','Ditolak')">✕ Tolak</button></div>`:""}
 </article>`).join(""):"<div class='admin-order'>Belum ada pesanan.</div>";
}
function updateStatus(id,status){const o=getOrders();const x=o.find(v=>v.id===id);if(x){x.status=status;saveOrders(o);renderAdmin();}}
function clearOrders(){if(confirm("Hapus semua pesanan demo?")){localStorage.removeItem("topup_orders");renderAdmin();}}
