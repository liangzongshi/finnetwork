$(document).ready(()=>{
   const socket = io()
    socket.on('connect', () => {})
   
   var options = {
         series: [],
         chart: {
         height: 800,
         type: 'bubble',
      },
      dataLabels: {
         enabled: false
      },
      fill: {
         type: 'gradient',
      },
      title: {
         text: "AI TRAINING CHART",
         align: 'center',
         margin: 10,
         offsetX: 0,
         offsetY: 0,
         floating: false,
         style: {
           fontSize:  '18px',
           fontWeight:  'bold',
           color:  '#fff'
         },
     },
      xaxis: {
         tickAmount: 12,
         type: 'datetime',
         labels: {
            rotate: 0,
         }
      },
      yaxis: {
         max: 100,
         label: {
            style: {
               color: '#fff'
             }
         }
      },
      grid: {
         yaxis: {
           lines: {
             show: false
           }
         }
       },
      theme: {
         palette: 'palette2'
      },
      plotOptions: {
         bubble: {
           minBubbleRadius: 5,
           maxBubbleRadius: 25,
         }
     }
   };

   var chart = new ApexCharts(document.querySelector("#chart_div1"), options);
   chart.render();
   socket.on("ai_traning", data=>{
      chart.updateSeries([{
         name: 'a1',
         data: data.data_1
      },
      {
         name: 'a2',
         data: data.data_2
      },
      {
         name: 'a3',
         data: data.data_3
      },
      {
         name: 'a4',
         data: data.data_4
      }])
   })
})

