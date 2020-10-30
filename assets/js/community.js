window.modActive = false;
$(document).ready(function() {
    let animate = true;
    let selector = 'last24h';
    let lastPrice = 9999;
    let lastCost = 9999;
    let infos = [];
    let infos_idx = 0;
    let info_timer = -1;
    let msgurl = "./msg";
    let upd_singleton = 0;
    if(typeof $.getUrlVar('reset') !== 'undefined') {
        window.localStorage.removeItem('msg');
    }

    if(typeof $.getUrlVar('s') !== 'undefined') {
        selector = $.getUrlVar('s');
        if(selector == 'last24h') {
            $('#selectorLabel').html("Die letzten 24 Stunden");
        }
        if(selector == 'last7d') {
            $('#selectorLabel').html("Die letzten 7 Tage");
        }
        if(selector == 'last30d') {
            $('#selectorLabel').html("Die letzten 30 Tage");
        }
        if(selector == 'last90d') {
            $('#selectorLabel').html("Die letzten 90 Tage");
        }
        if(selector == 'last180d') {
            $('#selectorLabel').html("Die letzten 180 Tage");
        }
        if(selector == 'last365d') {
            $('#selectorLabel').html("Die letzten 365 Tage");
        }
        if(selector == 'next24h') {
            $('#selectorLabel').html("Kommende 24 Stunden");
        }
    } else {
         $('#selectorLabel').html("Die letzten 24 Stunden");
    }
   const updateInfo = function() {
   }
   const render = function() {
        try {
         if((typeof window.localStorage.getItem('msg') !== 'undefined') && (window.localStorage.getItem('msg') !== null)) {
           let data = JSON.parse(window.localStorage.getItem('msg'));
          if(lastPrice !== data.stats[selector].energyPrice_kwh) {
                 if(lastPrice !== 9999) {
                     if(lastPrice < data.stats[selector].energyPrice_kwh) {
                         $('#priceUp').show();
                         $('#priceDown').hide();
                         $('#energyPrice_kwh').addClass('corrently_orange');
                         $('#energyPrice_kwh').removeClass('corrently_green');
                     }
                     if(lastPrice > data.stats[selector].energyPrice_kwh) {
                         $('#priceUp').hide();
                         $('#priceDown').show();
                         $('#energyPrice_kwh').removeClass('corrently_orange');
                         $('#energyPrice_kwh').addClass('corrently_green');
                     }
                 }
                 lastPrice = data.stats[selector].energyPrice_kwh;
               }
                if(lastCost !== data.stats[selector].incomeSaldo) {
                 if(lastCost !== 9999) {
                     if(lastCost < data.stats[selector].incomeSaldo) {
                         $('#costDown').show();
                         $('#costUp').hide();
                         $('#incomeSaldo').addClass('corrently_green');
                         $('#incomeSaldo').removeClass('corrently_orange');
                     }
                     if(lastCost > data.stats[selector].incomeSaldo) {
                         $('#costDown').hide();
                         $('#costUp').show();
                         $('#incomeSaldo').addClass('corrently_orange');
                         $('#incomeSaldo').removeClass('corrently_green');
                     }
                 }
                 lastCost = data.stats[selector].incomeSaldo;
               }
               if(data.stats[selector].energyProd_wh == 0) { data.stats[selector].energyProd_wh = 0.0001; }
               if(selector=='last24h')  { $('#modErz').attr('max','100'); $('#modBedarf').attr('max','100');}
               if(selector=='last7d') { $('#modErz').attr('max','1000'); $('#modBedarf').attr('max','1000'); }
               if(selector=='last30d') { $('#modErz').attr('max','5000'); $('#modBedarf').attr('max','5000'); }
               if(selector=='last90d') { $('#modErz').attr('max','5000'); $('#modBedarf').attr('max','5000'); }
               if(selector=='last180d') { $('#modErz').attr('max','25000'); $('#modBedarf').attr('max','25000'); }
               if(selector=='last365d') { $('#modErz').attr('max','50000'); $('#modBedarf').attr('max','50000'); }
                 $('#eigenRow').show();
                 let eigenverbrauch = 1 - (data.stats[selector].energyOut_wh / data.stats[selector].energyProd_wh);
                 if(window.modActive===false) {
                   $('#modEigenverbrauch').val(eigenverbrauch*100); // Only set if not set...
                   $('#modAmotisation').val(data.stats[selector].amortization);
                   $('#amotisation').html(data.stats[selector].amortization);
                   $('#erz').html((data.stats[selector].energyProd_wh/1000).toLocaleString('de-DE',{'minimumFractionDigits':3,'maximumFractionDigits':3}));
                   $('#modErz').val(data.stats[selector].energyProd_wh/1000);
                   $('#modBedarf').val(data.stats[selector].consumption_wh/1000);
                 } else {
                   data.stats[selector].amortization = $('#modAmotisation').val() * 1;
                   data.stats[selector].energyProd_wh = $('#modErz').val()*1000;
                   data.stats[selector].consumption_wh = $('#modBedarf').val()*1000;
                   eigenverbrauch = $('#modEigenverbrauch').val()/100;
                   let einspeisetarif = data.stats[selector].energyIncome / data.stats[selector].energyOut_wh;
                   data.stats[selector].energyOut_wh = data.stats[selector].energyProd_wh * (1- eigenverbrauch );
                   data.stats[selector].energySelf_wh = data.stats[selector].energyProd_wh - data.stats[selector].energyOut_wh;
                   data.stats[selector].energyIncome = data.stats[selector].energyOut_wh * einspeisetarif;
                   data.stats[selector].energySavingsSelf = (data.meterinfo.energyPriceWh/100) * data.stats[selector].energySelf_wh;
                   data.stats[selector].energySavingsSelf = Math.round((data.meterinfo.energyPriceWh-(einspeisetarif)) * data.stats[selector].energySelf_wh *100)/100;
                   data.stats[selector].energyRevenue = data.stats[selector].energyIncome + data.stats[selector].energySavingsSelf + data.stats[selector].correntlyIncome;
                   data.stats[selector].energy_wh =  data.stats[selector].consumption_wh - data.stats[selector].energySelf_wh;
                   data.stats[selector].energyCost = data.stats[selector].energy_wh * data.meterinfo.energyPriceWh;
                   data.stats[selector].energySpendings = data.stats[selector].energyCost + data.stats[selector].baseCosts + data.stats[selector].amortization;
                   data.stats[selector].incomeSaldo = data.stats[selector].energyRevenue - data.stats[selector].energySpendings;
                   data.stats[selector].energyPrice_kwh = (-1000) * (data.stats[selector].incomeSaldo / data.stats[selector].consumption_wh);
                   data.stats[selector].energyPriceWh  = data.stats[selector].energyPrice_kwh/1000;
                 }
                 // console.log("Energy Cost",data.stats[selector].energyCost);
                 $('#eigenverbrauchsQuote').html(Math.round(eigenverbrauch*100));
                 $('#amotisation').html(data.stats[selector].amortization);
                 $('#bedarf').html((data.stats[selector].consumption_wh/1000).toLocaleString('de-DE',{'minimumFractionDigits':3,'maximumFractionDigits':3}));

               $('#energyPrice_kwh').html((data.stats[selector].energyPrice_kwh*100).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));

               $('#last24h').html((data.stats.last24h.energyPrice_kwh*100).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));
               if(typeof data.stats.last7d !== 'undefined') $('#last7d').html((data.stats.last7d.energyPrice_kwh*100).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));

                if(typeof data.stats.last30d !== 'undefined') $('#last30d').html((data.stats.last30d.energyPrice_kwh*100).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));

             if(typeof data.stats.last90d !== 'undefined') $('#last90d').html((data.stats.last90d.energyPrice_kwh*100).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));

             if(typeof data.stats.last180d !== 'undefined') $('#last180d').html((data.stats.last180d.energyPrice_kwh*100).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));

                if(typeof data.stats.next24h !== 'undefined') $('#next24h').html((data.stats.next24h.energyPrice_kwh*100).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));

                if(typeof data.stats.last365d !== 'undefined') $('#last365d').html((data.stats.last365d.energyPrice_kwh*100).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));
               $('.updateTS').html(new Date(data.time).toLocaleString());

               $('#e24h').html((data.stats.last24h.energyRevenue).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));
               if(typeof data.stats.last7d !== 'undefined') $('#e7d').html((data.stats.last7d.energyRevenue).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));
               if(typeof data.stats.last30d !== 'undefined') $('#e30d').html((data.stats.last30d.energyRevenue).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));
                if(typeof data.stats.last90d !== 'undefined') $('#e90d').html((data.stats.last90d.energyRevenue).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));
                if(typeof data.stats.last180d !== 'undefined') $('#e180d').html((data.stats.last180d.energyRevenue).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));

               if(typeof data.stats.last365d !== 'undefined') $('#e365d').html((data.stats.last365d.energyRevenue).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));

               $('#a24h').html((data.stats.last24h.energySpendings).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));
               if(typeof data.stats.last7d !== 'undefined') $('#a7d').html((data.stats.last7d.energySpendings).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));
               if(typeof data.stats.last30d !== 'undefined') $('#a30d').html((data.stats.last30d.energySpendings).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));
                if(typeof data.stats.last90d !== 'undefined') $('#a90d').html((data.stats.last90d.energySpendings).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));
             if(typeof data.stats.last180d !== 'undefined') $('#a180d').html((data.stats.last180d.energySpendings).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));
               if(typeof data.stats.last365d !== 'undefined') $('#a365d').html((data.stats.last365d.energySpendings).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));

               $('#incomeSaldo').html((data.stats[selector].incomeSaldo*(-1)).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));
               $('#s24h').html((data.stats.last24h.incomeSaldo*(-1)).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}));
               if(typeof data.stats.last7d !== 'undefined') $('#s7d').html((data.stats.last7d.incomeSaldo*(-1)).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2})); else  $('.row7d').hide();
               if(typeof data.stats.last30d !== 'undefined') $('#s30d').html((data.stats.last30d.incomeSaldo*(-1)).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2})); else  $('.row30d').hide();
             if(typeof data.stats.last90d !== 'undefined') $('#s90d').html((data.stats.last90d.incomeSaldo*(-1)).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2})); else  $('.row90d').hide();
             if(typeof data.stats.last180d !== 'undefined') $('#s180d').html((data.stats.last180d.incomeSaldo*(-1)).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2})); else  $('.row180d').hide();
               if(typeof data.stats.last365d !== 'undefined') $('#s365d').html((data.stats.last365d.incomeSaldo*(-1)).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2})); else  $('.row365d').hide();

               if(typeof data.stats.next24h !== 'undefined') {} else  $('.rownext24h').hide();

               document.title = ""+(data.stats[selector].energyPrice_kwh*100).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2})+"/kWh " + (data.stats[selector].incomeSaldo*(-1)).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}) + "/Tag";


             if(typeof data.stats[selector].saldo_wh !== 'undefined') {
                 let sum_e = 0;
                 let cnt_e = 0;
                 let sum_b = 0;
                 let cnt_b = 0;

                 for(let i=0;i<data.stats[selector].saldo_wh.saldo.length;i++) {
                     if(data.stats[selector].saldo_wh.saldo[i] >0 ) {
                         sum_e += data.stats[selector].saldo_wh.saldo[i];
                         cnt_e ++;
                     } else {
                         sum_b += data.stats[selector].saldo_wh.saldo[i];
                         cnt_b ++;
                     }
                 }
                 let avg_e = 0;
                 let avg_b = 0;
                 if(cnt_e > 0 ) {
                     avg_e = sum_e / cnt_e;
                 }
                 if(cnt_b > 0) {
                     avg_b = sum_b / cnt_b;
                 }
                 let trail_html = '<table width="90%" style="width:90%"><tr style="height:5px;">';
                 let day = new Date(data.stats[selector].saldo_wh.start).getDay();
                 for(let i=0;i<data.stats[selector].saldo_wh.saldo.length;i++) {
                        let tsi = (((data.stats[selector].saldo_wh.end - data.stats[selector].saldo_wh.start)/data.stats[selector].saldo_wh.saldo.length)*i)+data.stats[selector].saldo_wh.start;
                        let tst = new Date(tsi).toLocaleString();
                        if((new Date(tsi).getDay() !== day)&&((selector=='last7d')||(selector=='last30d')||(selector=='last90d')||(selector=='last180d'))) {
                            day = new Date(tsi).getDay();
                            trail_html+='</tr><tr style="height:5px;">';
                        }

                        if(data.stats[selector].saldo_wh.saldo[i] >0 ) {
                            if(data.stats[selector].saldo_wh.saldo[i] > avg_e) {
                                trail_html += '<td style="background-color:#FFA700" title="'+tst+' Bezug:'+Math.abs(data.stats[selector].saldo_wh.saldo[i])+' Wh"></td>';
                            } else {
                                trail_html += '<td style="background-color:#FFF6E4" title="'+tst+' Bezug:'+Math.abs(data.stats[selector].saldo_wh.saldo[i])+' Wh"></td>';
                            }
                        } else {
                            if(data.stats[selector].saldo_wh.saldo[i] < avg_b) {
                                trail_html += '<td style="background-color:#006c32" title="'+tst+' Einspeisung:'+Math.abs(data.stats[selector].saldo_wh.saldo[i])+' Wh"></td>';
                            } else {
                                trail_html += '<td style="background-color:#86df9b" title="'+tst+' Einspeisung:'+Math.abs(data.stats[selector].saldo_wh.saldo[i])+' Wh"></td>';
                            }
                        }

                  }
                 trail_html += '</tr></table>';
                 $('#trail').html(trail_html);
                if(typeof data.latest.power_w !== 'undefined') {
                    $('#peerStatus').show();
                    if(data.latest.power_w >0) {
                        if(data.latest.power_w > avg_e)
                        {
                            $('#peerStatus').css('color','#ffa700');
                        } else {
                            $('#peerStatus').css('color','#FFDD98');
                        }
                    } else {
                        if(data.latest.power_w < avg_b)
                        {
                            $('#peerStatus').css('color','#006c32');
                        } else {
                            $('#peerStatus').css('color','#86df9b');
                        }
                    }
                    $('#peerStatus').attr('title',data.latest.power_w + "W");
                }
             }
               let ctx = $('#einnahmenChart');

               let edonut_data = [];
               let elabels = [];
               let ebar_datasets = [];
               let ebar_labels = [];

               ebar_labels.push('24 Stunden');
               let summe = (data.stats['last24h'].energySavingsSelf + data.stats['last24h'].energyIncome + data.stats['last24h'].correntlyIncome)/100;
               ebar_datasets.push({
                   label:'Eigenstrom',
                   backgroundColor:'#006c32',
                   data:[data.stats['last24h'].energySavingsSelf/summe]
               });
               ebar_datasets.push({
                   label:'Einspeisung',
                   backgroundColor:'#318b4e',
                   data:[data.stats['last24h'].energyIncome/summe]
               });
               ebar_datasets.push({
                   label:'Corrently',
                   backgroundColor:'#86df9b',
                   data:[data.stats['last24h'].correntlyIncome/summe]
               });
               if(typeof data.stats['last7d'] !== 'undefined') {
                   summe = (data.stats['last7d'].energySavingsSelf + data.stats['last7d'].energyIncome + data.stats['last7d'].correntlyIncome)/100;
                       ebar_labels.push('7 Tage');
                       ebar_datasets[0].data.push(data.stats['last7d'].energySavingsSelf/summe);
                       ebar_datasets[1].data.push(data.stats['last7d'].energyIncome/summe);
                       ebar_datasets[2].data.push(data.stats['last7d'].correntlyIncome/summe);
               }
               if(typeof data.stats['last30d'] !== 'undefined') {
                        ebar_labels.push('30 Tage');
                     summe = (data.stats['last30d'].energySavingsSelf + data.stats['last30d'].energyIncome + data.stats['last30d'].correntlyIncome)/100;
                       ebar_datasets[0].data.push(data.stats['last30d'].energySavingsSelf/summe);
                       ebar_datasets[1].data.push(data.stats['last30d'].energyIncome/summe);
                       ebar_datasets[2].data.push(data.stats['last30d'].correntlyIncome/summe);
               }
                if(typeof data.stats['last90d'] !== 'undefined') {
                        ebar_labels.push('90 Tage');
                     summe = (data.stats['last90d'].energySavingsSelf + data.stats['last90d'].energyIncome + data.stats['last90d'].correntlyIncome)/100;
                       ebar_datasets[0].data.push(data.stats['last90d'].energySavingsSelf/summe);
                       ebar_datasets[1].data.push(data.stats['last90d'].energyIncome/summe);
                       ebar_datasets[2].data.push(data.stats['last90d'].correntlyIncome/summe);
               }
             if(typeof data.stats['last180d'] !== 'undefined') {
                        ebar_labels.push('180 Tage');
                     summe = (data.stats['last180d'].energySavingsSelf + data.stats['last180d'].energyIncome + data.stats['last180d'].correntlyIncome)/100;
                       ebar_datasets[0].data.push(data.stats['last180d'].energySavingsSelf/summe);
                       ebar_datasets[1].data.push(data.stats['last180d'].energyIncome/summe);
                       ebar_datasets[2].data.push(data.stats['last180d'].correntlyIncome/summe);
               }
                if(typeof data.stats['last365d'] !== 'undefined') {
                       ebar_labels.push('365 Tage');
                     summe = (data.stats['last365d'].energySavingsSelf + data.stats['last365d'].energyIncome +    data.stats['last365d'].correntlyIncome)/100;
                       ebar_datasets[0].data.push(data.stats['last365d'].energySavingsSelf/summe);
                       ebar_datasets[1].data.push(data.stats['last365d'].energyIncome/summe);
                       ebar_datasets[2].data.push(data.stats['last365d'].correntlyIncome/summe);
               }

               edonut_data.push(data.stats[selector].energySavingsSelf);
               elabels.push("Eigenstrom");

               edonut_data.push(data.stats[selector].energyIncome);
               elabels.push("Einspeisung");

               edonut_data.push(data.stats[selector].correntlyIncome);
               elabels.push("Corrently Erzeugung");

               if($('#einnahmenChart').length !==0)  {
                  let myChartE = new Chart(ctx, {
                  type: 'doughnut',
                  data: {
                    datasets: [{
                        label: 'Einnahmen Verteilung',
                        data: edonut_data,
                        backgroundColor: [
                          '#006c32',
                          '#318b4e',
                          '#86df9b'
                        ]
                    }],
                    labels: elabels
                  },
                  options: {
                    responsive: true,
                    legend: {
                      position: 'right',
                    },
                    plugins: {
                       datalabels: {
                           display:true,
                           color:'#000000',
                           formatter: function(value, context) {
                                return ((value/data.stats[selector].energyRevenue)*100).toFixed(1).replace('.',',')+"%";
                            }
                       }
                    },
                    title: {
                      display: false,
                      text: ''
                    },
                    animation: {
                      animateScale: animate,
                      animateRotate: animate
                    },
                    tooltips: {
                          enabled: true,
                          mode: 'single',
                          callbacks: {
                            label: function(tooltipItems, data) {
                              return elabels[tooltipItems.index] + ': ' + data.datasets[0].data[tooltipItems.index] + '€';
                            }
                          }
                    },
                    elements: {
                        center: {
                          text: (data.stats[selector].energyRevenue).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}),
                          color: '#006C32', // Default is #000000
                          fontStyle: 'Arial', // Default is Arial
                          sidePadding: 20, // Default is 20 (as a percentage)
                          minFontSize: 20, // Default is 20 (in px), set to false and text will not wrap.
                          lineHeight: 25 // Default is 25 (in px), used for when text wraps
                        }
                      }
                  }
              });
               ctx.click(function() {
                  $('#modalEinnahmen').modal("show");
               });
               let ctxEB = $('#einnahmenChartB');
               let myChartEB = new Chart(ctxEB, {
                  type: 'bar',
                  data: {
                    datasets: ebar_datasets,
                    labels: ebar_labels
                  },
                  options: {
                    responsive: true,
                    tooltips: {
                          enabled: true,
                          mode: 'single',
                          callbacks: {
                            label: function(tooltipItems, data) {
                              return data.datasets[tooltipItems.datasetIndex].label + ': ' + Math.round(tooltipItems.value) + '%';
                            }
                          }
                    },
                    plugins: {
                       datalabels: {
                           display:true,
                           color:'#000000',
                           formatter: function(value, context) {
                                return Math.round(value)+"%";
                            }
                       }
                    },
                    legend: {
                      position: 'right',
                    },
                    title: {
                      display: false,
                      text: ''
                    },
                    animation: {
                      animateScale: animate,
                      animateRotate: animate
                      },
                    scales: {
						xAxes: [{
							stacked: true,
						}],
						yAxes: [{
							stacked: true,
                            ticks: {
							min: 0,
							max: 100
						    }
						}]
					}
                  }
              });

               let ctxa = $('#ausgabenChart');

               let donut_data = [];
               let labels = [];

               donut_data.push(data.stats[selector].energyCost);
               labels.push("Strombezug");

               donut_data.push(data.stats[selector].amortization);
               labels.push("Abschreibung");

               donut_data.push(data.stats[selector].baseCosts);
               labels.push("Grundgebühr");

               let abar_datasets = [];
               let abar_labels = [];

               abar_labels.push('24 Stunden');
               let summe = (data.stats['last24h'].energyCost + data.stats['last24h'].amortization + data.stats['last24h'].baseCosts)/100;
               abar_datasets.push({
                   label:'Strombezug',
                   backgroundColor:'#FFA700',
                   data:[data.stats['last24h'].energyCost/summe]
               });
               abar_datasets.push({
                   label:'Abschreibung',
                   backgroundColor:'#FF8922',
                   data:[data.stats['last24h'].amortization/summe]
               });
               abar_datasets.push({
                   label:'Grundgebühr',
                   backgroundColor:'#FFF6E4',
                   data:[data.stats['last24h'].baseCosts/summe]
               });
               if(typeof data.stats['last7d'] !== 'undefined') {
                   summe = (data.stats['last7d'].energyCost + data.stats['last7d'].amortization + data.stats['last7d'].baseCosts)/100;
                       abar_labels.push('7 Tage');
                       abar_datasets[0].data.push(data.stats['last7d'].energyCost/summe);
                       abar_datasets[1].data.push(data.stats['last7d'].amortization/summe);
                       abar_datasets[2].data.push(data.stats['last7d'].baseCosts/summe);
               }
               if(typeof data.stats['last30d'] !== 'undefined') {
                        abar_labels.push('30 Tage');
                     summe = (data.stats['last30d'].energyCost + data.stats['last30d'].amortization + data.stats['last30d'].baseCosts)/100;
                       abar_datasets[0].data.push(data.stats['last30d'].energyCost/summe);
                       abar_datasets[1].data.push(data.stats['last30d'].amortization/summe);
                       abar_datasets[2].data.push(data.stats['last30d'].baseCosts/summe);
               }
              if(typeof data.stats['last90d'] !== 'undefined') {
                        abar_labels.push('90 Tage');
                     summe = (data.stats['last90d'].energyCost + data.stats['last90d'].amortization + data.stats['last90d'].baseCosts)/100;
                       abar_datasets[0].data.push(data.stats['last90d'].energyCost/summe);
                       abar_datasets[1].data.push(data.stats['last90d'].amortization/summe);
                       abar_datasets[2].data.push(data.stats['last90d'].baseCosts/summe);
               }
              if(typeof data.stats['last180d'] !== 'undefined') {
                        abar_labels.push('180 Tage');
                     summe = (data.stats['last180d'].energyCost + data.stats['last180d'].amortization + data.stats['last180d'].baseCosts)/100;
                       abar_datasets[0].data.push(data.stats['last180d'].energyCost/summe);
                       abar_datasets[1].data.push(data.stats['last180d'].amortization/summe);
                       abar_datasets[2].data.push(data.stats['last180d'].baseCosts/summe);
               }
                if(typeof data.stats['last365d'] !== 'undefined') {
                       abar_labels.push('365 Tage');
                     summe = (data.stats['last365d'].energyCost + data.stats['last365d'].amortization +    data.stats['last365d'].baseCosts)/100;
                       abar_datasets[0].data.push(data.stats['last365d'].energyCost/summe);
                       abar_datasets[1].data.push(data.stats['last365d'].amortization/summe);
                       abar_datasets[2].data.push(data.stats['last365d'].baseCosts/summe);
               }
               ctxa.click(function() {
                  $('#modalAusgaben').modal("show");
               });
               let myChartA = new Chart(ctxa, {
                  type: 'doughnut',
                  data: {
                    datasets: [{
                        label: 'Ausgaben Verteilung',
                        data: donut_data,
                        backgroundColor: [
                          '#FFA700',
                          '#FF8922',
                          '#FFF6E4'
                        ]
                    }],
                    labels: labels
                  },
                  options: {
                    responsive: true,
                    legend: {
                      position: 'left',
                    },
                    plugins: {
                       datalabels: {
                           display:true,
                           color:'#000000',
                           formatter: function(value, context) {
                                return ((value/data.stats[selector].energySpendings)*100).toFixed(1).replace('.',',')+"%";
                            }
                       }
                    },
                    title: {
                      display: false,
                      text: ''
                    },
                    animation: {
                      animateScale: animate,
                      animateRotate: animate
                    },
                    tooltips: {
                          enabled: true,
                          mode: 'single',
                          callbacks: {
                            label: function(tooltipItems, data) {
                              return labels[tooltipItems.index] + ': ' + data.datasets[0].data[tooltipItems.index] + '€';
                            }
                          }
                    },
                    elements: {
                        center: {
                          text: (data.stats[selector].energySpendings).toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2}),
                          color: '#FFA700', // Default is #000000
                          fontStyle: 'Arial', // Default is Arial
                          sidePadding: 20, // Default is 20 (as a percentage)
                          minFontSize: 20, // Default is 20 (in px), set to false and text will not wrap.                          lineHeight: 25 // Default is 25 (in px), used for when text wraps
                        }
                      }
                  }
              });

              let ctxAB = $('#ausgabenChartB');
               let myChartAB = new Chart(ctxAB, {
                  type: 'bar',
                  data: {
                    datasets: abar_datasets,
                    labels: abar_labels
                  },
                  options: {
                    responsive: true,
                    tooltips: {
                          enabled: true,
                          mode: 'single',
                          callbacks: {
                            label: function(tooltipItems, data) {
                              return data.datasets[tooltipItems.datasetIndex].label + ': ' + Math.round(tooltipItems.value) + '%';
                            }
                          }
                    },
                    plugins: {
                       datalabels: {
                           display:true,
                           color:'#000000',
                           formatter: function(value, context) {
                                return Math.round(value)+"%";
                            }
                       }
                    },
                    legend: {
                      position: 'right',
                    },
                    title: {
                      display: false,
                      text: ''
                    },
                    animation: {
                      animateScale: animate,
                      animateRotate: animate
                      },
                    scales: {
						xAxes: [{
							stacked: true,
						}],
						yAxes: [{
							stacked: true,
                            ticks: {
							min: 0,
							max: 100
						    }
						}]
					}
                  }
              });
        }
             if(animate) {
                 setTimeout(function() {
                    $('#info').addClass('show');
                 },2000);
             }
              animate = false;
             let costs = (data.stats[selector].consumption_wh * data.meterinfo.energyPriceWh) + data.stats[selector].baseCosts;
             let savings = Math.round((1-(((-1)*data.stats[selector].incomeSaldo)/costs))*(10000))/100;

            if(info_timer < new Date().getTime() - 60000) {
             if((window.swiper.slides) && ( window.swiper.slides.length > 0)) {
                        window.swiper.removeAllSlides();
             }
             if(window.swiper.slides) {
                 window.swiper.appendSlide('<div class="blog-slider__item swiper-slide"><div class="blog-slider__content"><div class="blog-slider__title"><i class="fa fa-info-circle" style="  margin-right: 10px;"></i>Ausgaben</div><div class="blog-slider__text" id="info0"><strong>'+Math.round((data.stats[selector].energyCost/data.stats[selector].energySpendings)*100)+'%</strong> der Kosten von '+data.stats[selector].energySpendings.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2})+'€ für die Stromversorgung sind variabel, d.h. können durch den Verbrauch unmittelbar beeinflusst werden.</div></div></div>');

                 window.swiper.appendSlide('<div class="blog-slider__item swiper-slide"><div class="blog-slider__content"><div class="blog-slider__title"><i class="fa fa-wrench" style="  margin-right: 10px;"></i>Ergebnis</div><div class="blog-slider__text" id="info1">Steigere den Netzbezug zu Zeiten mit hohen Werten des GrünstromIndex, um die Erträge aus Corrently Erzeugung von derzeit <strong>'+data.stats[selector].correntlyIncome.toLocaleString('de-DE',{'minimumFractionDigits':2,'maximumFractionDigits':2})+'€</strong> zu eröhen.</div></div></div>');

                 window.swiper.appendSlide('<div class="blog-slider__item swiper-slide"><div class="blog-slider__content"><div class="blog-slider__title"><i class="fa fa-tachometer" style="  margin-right: 10px;"></i>Ergebnis</div><div class="blog-slider__text" id="info1"><strong>'+savings.toLocaleString('de-DE',{'minimumFractionDigits':0,'maximumFractionDigits':2})+'%</strong> im Vergleich zu einem Anschluss ohne eigene Erzeugung, Speicher oder Corrently GrünstromBonus.</div></div></div>');
                }
                info_timer = new Date().getTime();
             }
           }
    $('#modEigenverbrauch').change(function() {
        if(!window.modActive) {
          $('.planerRows').hide();
          $('#eigenRow').show();
        }
        window.modActive = true;

        render();
    });
    $('#modEigenverbrauch').on('input change',function() {
        $('#eigenverbrauchsQuote').html($('#modEigenverbrauch').val());
    });
    $('#modAmotisation').change(function() {
      if(!window.modActive) {
        $('.planerRows').hide();
        $('#amotRow').show();
      }
        window.modActive = true;
        render();
    });
    $('#modAmotisation').on('input change',function() {
        $('#amotisation').html($('#modAmotisation').val());
    });
    $('#modErz').change(function() {
      if(!window.modActive) {
        $('.planerRows').hide();
        $('#erzRow').show();
      }
        window.modActive = true;
        render();
    });
    $('#modErz').on('input change',function() {
        $('#erz').html(($('#modErz').val()/1000).toLocaleString('de-DE',{'minimumFractionDigits':3,'maximumFractionDigits':3}));
    });
    $('#modBedarf').change(function() {
        if(!window.modActive) {
          $('.planerRows').hide();
          $('#bedRow').show();
        }
        window.modActive = true;
        render();
    });
    $('#modBedarf').on('input change',function() {
        $('#bedarf').html(($('#modBedarf').val()/1000).toLocaleString('de-DE',{'minimumFractionDigits':3,'maximumFractionDigits':3}));
    });
      } catch(e) {
          console.log(e);
          window.localStorage.removeItem('msg');
          console.log("Removed stalled cached msg");
          setTimeout(function() {
              update();
          },1000);
      }
   }
   const update = function() {

    if((typeof window.localStorage.getItem('cid') !== 'undefined') &&(window.localStorage.getItem('cid')!==null)){
        msgurl='./p2p?method=msg&peer='+window.localStorage.getItem('cid');
    } else {
        msgurl='./msg';
    }
       if((upd_singleton > 20) || (upd_singleton==0)) {

           $.getJSON(msgurl,function(data) {
               window.localStorage.setItem('msg',JSON.stringify(data));
               upd_singleton=0;
               render();
           }).fail(function() {
               console.log("Switched to WAN Source");
               $.getJSON("https://casa-corrently-demo.herokuapp.com/"+msgurl,function(data) {
                    window.localStorage.setItem('msg',JSON.stringify(data));
                    upd_singleton=0;
                    render();
               })
           });
       }
        upd_singleton++;
   }
   render();
   setInterval(update,10000);
   update();

});
