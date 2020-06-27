$(document).ready(() => {
    const socket = io()

    var xchart, ychart
    socket.on('appendOrder', data => {
        
        xchart.updateSeries([{
            data: data.series
        }])

        data.orders.forEach((order, st) => {
            $(`#${st+1}_timestamp`).html(order.timestamp)
            $(`#${st+1}_type`).html(order.type)
            $(`#${st+1}_amount`).html(order.amount)
            $(`#${st+1}_buy`).html(order.buy.price)
            $(`#${st+1}_sell`).html(order.sell.price)
            $(`#${st+1}_profit`).html(order.profit)
        })

        $('#current_profit').html(data.profit)
        $('#total_profit').html(data.total_profit)
        $('#number').html(data.number)
    })

    socket.on('startChart', data => {
        console.log(data)
        var options = {
            series: [{
                data: data
            }],
            xaxis: {
                type: 'datetime',
                // range: XAXISRANGE,
            },
            chart: {
                id: 'realtime',
                height: 350,
                type: 'line',
                animations: {
                    enabled: true,
                    easing: 'linear',
                    dynamicAnimation: {
                        speed: 900
                    }
                },
                toolbar: {
                    show: true
                },
                zoom: {
                    enabled: true
                }
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth'
            },
            title: {
                text: 'Profit per Order',
                align: 'center'
            },
            markers: {
                size: 0
            },
            yaxis: {
                max: 120,
                min: 0.05,
                axisBorder: {
                    show: true,
                    color: '#78909C'
                }
            },
            legend: {
                show: true
            },
        }  

        xchart = new ApexCharts(document.querySelector("#apex-line-chart"), options);
        xchart.render()
    })

    socket.on('daily_chart', data => {
        var options = {
            series: [{
                data: data.record_value
            }, {
                data: data.pay_value
            }],
            chart: {
                type: 'bar',
                height: 640
            },
            plotOptions: {
                bar: {
                    horizontal: false,
                    dataLabels: {
                        position: 'top',
                    },
                }
            },
            dataLabels: {
                enabled: true,
                offsetX: -6,
                style: {
                    fontSize: '9px',
                    colors: ['#fff']
                }
            },
            stroke: {
                show: true,
                width: 1,
                colors: ['#fff']
            },
            xaxis: {
                categories: data.record_label,
            },
            yaxis: {
                max: 150000,
                min: 10000,
                axisBorder: {
                    show: true,
                    color: '#78909C'
                }
            }
            
        }

        ychart = new ApexCharts(document.querySelector("#daily"), options)
        ychart.render()
    })
})