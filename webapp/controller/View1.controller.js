sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageBox",
	"sap/m/MessageToast",
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
	'sap/ui/model/FilterOperator',  
    "sap/ui/unified/DateTypeRange",
	"sap/ui/core/date/UI5Date",
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/BusyIndicator',
],
    /**
     * @param {typeof sap.ui.core.mvc.Controller} Controller
     */
    function (Controller, BusyIndicator) {
        "use strict";


        return Controller.extend("excelupload.controller.View1", {
            onInit: function () {
                var oRouter = this.getOwnerComponent().getRouter();
                oRouter.attachRoutePatternMatched(this._onRouteMatched, this);
                this.GetUploadHeaderData = [];
                this.GetUploadItemData = [];
                this.JArray = [];
                this.JObj = {};

                // var data = {
                //     results: [
                //         {
                //         "id":1,
                //         "title":"Title1",
                //         "content":"Data1"
                //         },
                //         {
                //             "id":2,
                //             "title":"Title2",
                //             "content":"Data2"
                //         },
                //     ]
                // };

                // data = new JSONModel(data);
                // this.getView().setModel(data, "myData")

                },
        
                _onRouteMatched: function(oEvent){

                    // ================================
                    this.getOwnerComponent().getModel().read("/YY1_GENERAL_PURCHASE/$count", { /* Decalure Globally in the Create table Serial Number */
                        success: $.proxy(function (oEvent, oResponse) {
                        let Count = Number(oResponse.body); // This should be a number, no need to use Number()
                        this.getView().byId("DocId").setValue(Count);        
                            }, this)
                        }); 
                    // ================================
                    console.log("-----------------------------------------------------------")

                    var ODataModel = this.getView().getModel("API_PURCHASEORDER_PROCESS_SRV");

                        ODataModel.read("/A_PurchaseOrder", {
                            success : function(OData){
                                console.log(OData);
                            }
                        });

                console.log("-----------------------------------------------------------")
                    // ================================
                  
                  if (!this.oFilterFrag)
                  this.oFilterFrag = sap.ui.xmlfragment("excelupload.view.upload", this);
                  this.getView().addDependent(this.oFilterFrag)
                 this.oFilterFrag.open();
                },


                OnOpenFrag:function(){
                      if (!this.oFilterFrag)
                      this.oFilterFrag = sap.ui.xmlfragment("excelupload.view.upload", this);
                      this.getView().addDependent(this.oFilterFrag)
                     this.oFilterFrag.open();
                },


                onUpload: function (e) {
                    this._import(e.getParameter("files") && e.getParameter("files")[0]);
                },
                
                _import: function (file) {
                    var that = this;
                    var excelHeaderData = {};
                    var excelData = {};
                    if (file && window.FileReader) {
                        var reader = new FileReader();
                        reader.onload = function (e) {
                            var data = e.target.result;
                            var workbook = XLSX.read(data, {
                                type: 'binary'
                            });
                            var sheet = workbook.SheetNames;
                            for( var i=0; i < workbook.SheetNames.length; i++){

                                if(workbook.SheetNames[i] === "Header"){
                                    excelHeaderData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[workbook.SheetNames[i]]);
                                }

                                if(workbook.SheetNames[i] === "Items"){
                                    excelData = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[workbook.SheetNames[i]], {blankRows: false, defval: '' });
                                    console.log(excelData)
                                }
                                
                            }
                            that.GetUploadHeaderData = excelHeaderData                         
                            that.GetUploadItemData = excelData                            
                        };
                        
                        reader.onerror = function (ex) {
                            console.log(ex);
                        };
                        reader.readAsBinaryString(file);
                    }

                },

                handleUploadPress: async function () {
                    
                    sap.ui.core.BusyIndicator.show();
                
                    var oJSONModel = new sap.ui.model.json.JSONModel({
                        data: {}
                    });
                    this.getView().setModel(oJSONModel, "JModel");
                
                    var ValCount = 1;
                
                    var today = new Date();
                    var dd = '' + today.getDate();
                    var mm = '' + (today.getMonth() + 1);
                    if (mm.length < 2) {
                        mm = '0' + mm;
                    }
                    if (dd.length < 2) {
                        dd = '0' + dd;
                    }
                    var yyyy = today.getFullYear();
                    this.CurrentDate = dd + '-' + mm + '-' + yyyy;
                    this.CurrentDate01 = '' + yyyy + '-' + mm + '-' + dd + '';
                
                    // alert(this.GetUploadHeaderData.length);
                
                    for (let i = 2; i < this.GetUploadHeaderData.length; i++) {
                        await this.processHeaderData(i);
                    }
                
                    sap.ui.core.BusyIndicator.hide();
                    this.oFilterFrag.destroy();
                    this.oFilterFrag = undefined;
                },
                
                processHeaderData: function (index) {
                    return new Promise((resolve, reject) => {
                        var RefId = this.GetUploadHeaderData[index].Document;
                        console.log("Header Document:" + this.GetUploadHeaderData[index].Document);
                
                        var ItemData = [];
                        for (var j = 2; j < this.GetUploadItemData.length; j++) {
                            console.log("Checking condition for inner loop:", index, j);
                            if (this.GetUploadHeaderData[index].Document === this.GetUploadItemData[j].Document) {
                                console.log("Condition matched for inner loop:", index, j);
                                ItemData.push({
                                    PurchaseOrderItemText: this.GetUploadItemData[j].PurchaseOrderItemText,
                                    Plant: this.GetUploadItemData[j].Plant,
                                    OrderQuantity: this.GetUploadItemData[j].OrderQuantity,
                                    NetPriceAmount: this.GetUploadItemData[j].NetPriceAmount,
                                    NetPriceQuantity: this.GetUploadItemData[j].NetPriceQuantity,
                                    PurchaseOrderItemCategory: this.GetUploadItemData[j].PurchaseOrderItemCategory,
                                    Material: this.GetUploadItemData[j].Material,
                                });
                            }
                        }
                
                        var oEntry = {};
                        oEntry.CompanyCode = this.GetUploadHeaderData[index].CompanyCode;
                        oEntry.PurchaseOrderType = this.GetUploadHeaderData[index].PurchaseOrderType;
                        oEntry.Supplier = this.GetUploadHeaderData[index].Supplier;
                        oEntry.PurchasingOrganization = this.GetUploadHeaderData[index].PurchasingOrganization;
                        oEntry.PurchasingGroup = this.GetUploadHeaderData[index].PurchasingGroup;
                        oEntry.to_PurchaseOrderItem = ItemData;
                
                        console.log("oEntry:", oEntry);
                                
                        var oModel = this.getOwnerComponent().getModel("API_PURCHASEORDER_PROCESS_SRV");
                        var that = this;
                
                        oModel.create("/A_PurchaseOrder", oEntry, {
                            method: "POST",
                            Accept: "application/json",
                            success: function (oData, oResponse) {
                                console.log("Success response:", oResponse);
                
                                that.JObj = { "refId": RefId, "Id": oData.PurchaseOrder, "Status": "Success", "Color":"Success" };
                                that.JArray.push(that.JObj);
                
                                var oJSONModel = new sap.ui.model.json.JSONModel({
                                    data: that.JArray
                                });
                                that.getView().setModel(oJSONModel, "JModel");
                
                                oModel.refresh(true);
                                resolve(oData);
                            },
                            error: function (error) {
                                console.log("Error response:"+ error);
                                // console.error("Not Uploaded"+ RefId);
                                that.JObj = { "refId": RefId, "Id": "", "Status": "Error", "Color":"Error" };
                                that.JArray.push(that.JObj);
                                var oJSONModel = new sap.ui.model.json.JSONModel({
                                    data: that.JArray
                                });
                                that.getView().setModel(oJSONModel, "JModel");
                
                                oModel.refresh(true);
                                resolve("oData");
                            }
                        });
                    });
                },
                

                //02 handleUploadPress: function () {
                //     this.oFilterFrag.destroy();
                //     this.oFilterFrag = undefined;
                //     sap.ui.core.BusyIndicator.show();
                
                //     var oJSONModel = new sap.ui.model.json.JSONModel({
                //         data: {}
                //     });
                //     this.getView().setModel(oJSONModel, "JModel");
                
                //     var ValCount = 1;
                
                //     var today = new Date();
                //     var dd = '' + today.getDate();
                //     var mm = '' + (today.getMonth() + 1);
                //     if (mm.length < 2) {
                //         mm = '0' + mm;
                //     }
                //     if (dd.length < 2) {
                //         dd = '0' + dd;
                //     }
                //     var yyyy = today.getFullYear();
                //     this.CurrentDate = dd + '-' + mm + '-' + yyyy;
                //     this.CurrentDate01 = '' + yyyy + '-' + mm + '-' + dd + '';
                
                //     alert(this.GetUploadHeaderData.length);
                
                //     var promises = [];
                
                //     for (var i = 2; i < this.GetUploadHeaderData.length; i++) {
                //         var promise = new Promise(function (resolve, reject) {
                //             var RefId = this.GetUploadHeaderData[i].Document;
                //             console.log("Header Document:" + this.GetUploadHeaderData[i].Document);
                
                //             var ItemData = [];
                //             for (var j = 2; j < this.GetUploadItemData.length; j++) {
                //                 console.log("Checking condition for inner loop:", i, j);
                //                 if (this.GetUploadHeaderData[i].Document === this.GetUploadItemData[j].Document) {
                //                     console.log("Condition matched for inner loop:", i, j);
                //                     ItemData.push({
                //                         PurchaseOrderItemText: this.GetUploadItemData[j].PurchaseOrderItemText,
                //                         Plant: this.GetUploadItemData[j].Plant,
                //                         OrderQuantity: this.GetUploadItemData[j].OrderQuantity,
                //                         NetPriceAmount: this.GetUploadItemData[j].NetPriceAmount,
                //                         NetPriceQuantity: this.GetUploadItemData[j].NetPriceQuantity,
                //                         PurchaseOrderItemCategory: this.GetUploadItemData[j].PurchaseOrderItemCategory,
                //                         Material: this.GetUploadItemData[j].Material,
                //                     });
                //                 }
                //             }
                
                //             var oEntry = {};
                //             oEntry.CompanyCode = this.GetUploadHeaderData[i].CompanyCode;
                //             oEntry.PurchaseOrderType = this.GetUploadHeaderData[i].PurchaseOrderType;
                //             oEntry.Supplier = this.GetUploadHeaderData[i].Supplier;
                //             oEntry.PurchasingOrganization = this.GetUploadHeaderData[i].PurchasingOrganization;
                //             oEntry.PurchasingGroup = this.GetUploadHeaderData[i].PurchasingGroup;
                //             oEntry.to_PurchaseOrderItem = ItemData;
                
                //             console.log("oEntry:", oEntry);
                //             console.log("oEntry:", ItemData);
                
                //             alert(RefId);
                
                //             var oModel = this.getOwnerComponent().getModel("API_PURCHASEORDER_PROCESS_SRV");
                //             var that = this;
                
                //             oModel.create("/A_PurchaseOrder", oEntry, {
                //                 method: "POST",
                //                 Accept: "application/json",
                //                 success: function (oData, oResponse) {
                //                     console.log("Success response:", oResponse);
                //                     alert("Success" + RefId);
                
                //                     that.JObj = { "refId": RefId, "Status": "S" };
                //                     that.JArray.push(that.JObj);
                
                //                     var oJSONModel = new sap.ui.model.json.JSONModel({
                //                         data: that.JArray
                //                     });
                //                     that.getView().setModel(oJSONModel, "JModel");
                
                //                     oModel.refresh(true);
                //                     resolve(oData);
                //                 },
                //                 error: function (error) {
                //                     console.log("Error response:", error);
                //                     alert("error", RefId);
                //                     console.error("Not Uploaded", RefId);
                //                     that.JObj = { "refId": RefId, "Status": "R" };
                //                     that.JArray.push(that.JObj);
                //                     var oJSONModel = new sap.ui.model.json.JSONModel({
                //                         data: that.JArray
                //                     });
                //                     that.getView().setModel(oJSONModel, "JModel");
                //                     reject(error);
                //                 }
                //             });
                //         }.bind(this));
                
                //         promises.push(promise);
                //     }
                
                //     // Wait for all promises to be resolved
                //     Promise.all(promises)
                //         .then(function (results) {
                //             console.log("All operations completed successfully:", results);
                //         })
                //         .catch(function (errors) {
                //             console.error("Error in one or more operations:", errors);
                //         })
                //         .finally(function () {
                //             sap.ui.core.BusyIndicator.hide();
                //         });
                // },
                

                //01 handleUploadPress: function () {
                //     this.oFilterFrag.destroy();
                //     this.oFilterFrag = undefined;
                //     sap.ui.core.BusyIndicator.show();
                
                //     var oJSONModel = new sap.ui.model.json.JSONModel({
                //         data: {}
                //     });
                //     this.getView().setModel(oJSONModel, "JModel");
                
                //     var ValCount = 1;
                
                //     var today = new Date();
                //     var dd = '' + today.getDate();
                //     var mm = '' + (today.getMonth() + 1);
                //     if (mm.length < 2) {
                //         mm = '0' + mm;
                //     }
                //     if (dd.length < 2) {
                //         dd = '0' + dd;
                //     }
                //     var yyyy = today.getFullYear();
                //     this.CurrentDate = dd + '-' + mm + '-' + yyyy;
                //     this.CurrentDate01 = '' + yyyy + '-' + mm + '-' + dd + '';
                
                //     alert(this.GetUploadHeaderData.length);
                
                //     var promises = [];
                
                //     for (var i = 2; i < this.GetUploadHeaderData.length; i++) {
                //         var promise = new Promise(function (resolve) {
                //             var RefId = this.GetUploadHeaderData[i].Document;
                //             console.log("Header Document:" + this.GetUploadHeaderData[i].Document);
                
                //             var ItemData = [];
                //             for (var j = 2; j < this.GetUploadItemData.length; j++) {
                //                 console.log("Checking condition for inner loop:", i, j);
                //                 if (this.GetUploadHeaderData[i].Document === this.GetUploadItemData[j].Document) {
                //                     console.log("Condition matched for inner loop:", i, j);
                //                     ItemData.push({
                //                         PurchaseOrderItemText: this.GetUploadItemData[j].PurchaseOrderItemText,
                //                         Plant: this.GetUploadItemData[j].Plant,
                //                         OrderQuantity: this.GetUploadItemData[j].OrderQuantity,
                //                         NetPriceAmount: this.GetUploadItemData[j].NetPriceAmount,
                //                         NetPriceQuantity: this.GetUploadItemData[j].NetPriceQuantity,
                //                         PurchaseOrderItemCategory: this.GetUploadItemData[j].PurchaseOrderItemCategory,
                //                         Material: this.GetUploadItemData[j].Material,
                //                     });
                //                 }
                //             }
                
                //             var oEntry = {};
                //             oEntry.CompanyCode = this.GetUploadHeaderData[i].CompanyCode;
                //             oEntry.PurchaseOrderType = this.GetUploadHeaderData[i].PurchaseOrderType;
                //             oEntry.Supplier = this.GetUploadHeaderData[i].Supplier;
                //             oEntry.PurchasingOrganization = this.GetUploadHeaderData[i].PurchasingOrganization;
                //             oEntry.PurchasingGroup = this.GetUploadHeaderData[i].PurchasingGroup;
                //             oEntry.to_PurchaseOrderItem = ItemData;
                
                //             console.log("oEntry:", oEntry);
                
                //             alert(RefId);
                
                //             var oModel = this.getOwnerComponent().getModel("API_PURCHASEORDER_PROCESS_SRV");
                //             var that = this;
                
                //             oModel.create("/A_PurchaseOrder", oEntry, {
                //                 method: "POST",
                //                 Accept: "application/json",
                //                 success: function (oData, oResponse) {
                //                     console.log(oResponse);
                //                     alert("Success" + RefId);
                
                //                     that.JObj = { "refId": RefId, "Status": "S" };
                //                     that.JArray.push(that.JObj);
                
                //                     var oJSONModel = new sap.ui.model.json.JSONModel({
                //                         data: that.JArray
                //                     });
                //                     that.getView().setModel(oJSONModel, "JModel");
                
                //                     // oModel.refresh(true);
                //                     resolve(oData);
                //                 },
                //                 error: function (error) {
                //                     alert("error"+ RefId);
                //                     console.error("Not Uploaded"+ RefId);
                //                     that.JObj = { "refId": RefId, "Status": "R" };
                //                     that.JArray.push(that.JObj);
                //                     var oJSONModel = new sap.ui.model.json.JSONModel({
                //                         data: that.JArray
                //                     });
                //                     that.getView().setModel(oJSONModel, "JModel");
                //                     reject(error);
                //                 }
                //             });
                //         }.bind(this));
                
                //         promises.push(promise);
                //     }
                
                //     // Wait for all promises to be resolved
                //     Promise.all(promises)
                //         .then(function (results) {
                //             console.log("All operations completed");
                //         })
                //         .catch(function (error) {
                //             console.error("Error in one or more operations", error);
                //         })
                //         .finally(function () {
                //             sap.ui.core.BusyIndicator.hide();
                //         });
                // },
                

                // handleUploadPress:function(){

                //     this.oFilterFrag.destroy();
                //     this.oFilterFrag = undefined;
                //     // sap.ui.core.BusyIndicator.show()

                //     var oJSONModel = new sap.ui.model.json.JSONModel({
                //         data: {}
                //     });
                //     this.getView().setModel(oJSONModel, "JModel");

                //     var ValCount = 1;

                //     // ----Start For Current Date -----
                //     var today = new Date();
                //     var dd = '' + today.getDate();
                //     var mm = '' + (today.getMonth() + 1); //January is 0!
                //     if (mm.length < 2) {
                //         mm = '0' + mm;
                //     }
                //     if (dd.length < 2) {
                //         dd = '0' + dd;
                //     }
                //     var yyyy = today.getFullYear();
                //     this.CurrentDate = dd + '-' + mm + '-' + yyyy;
                //     this.CurrentDate01 = '' + yyyy + '-' + mm + '-' + dd + '';
                //     // ----Start For Current Date -----

                //     alert(this.GetUploadHeaderData.length)
                
                //     for (var i=2; i < this.GetUploadHeaderData.length; i++){

                        

                //         var RefId = this.GetUploadHeaderData[i].Document;

                //         console.log("Header Document:" +this.GetUploadHeaderData[i].Document)
                        
                //         var ItemData = [];
                //         for(var j=2; j < this.GetUploadItemData.length; j++){
                //             if(this.GetUploadHeaderData[i].Document === this.GetUploadItemData[j].Document){
                //                 ItemData.push({
                //                     PurchaseOrderItemText : this.GetUploadItemData[j].PurchaseOrderItemText,
                //                     Plant : this.GetUploadItemData[j].Plant,
                //                     OrderQuantity : this.GetUploadItemData[j].OrderQuantity,
                //                     NetPriceAmount : this.GetUploadItemData[j].NetPriceAmount,
                //                     NetPriceQuantity : this.GetUploadItemData[j].NetPriceQuantity,
                //                     PurchaseOrderItemCategory : this.GetUploadItemData[j].PurchaseOrderItemCategory,
                //                     Material : this.GetUploadItemData[j].Material,
                //                 });
                //             }
                //         }

                        


                //         var oEntry = {};

                //         oEntry.CompanyCode=this.GetUploadHeaderData[i].CompanyCode;
                //         oEntry.PurchaseOrderType=this.GetUploadHeaderData[i].PurchaseOrderType;
                //         oEntry.Supplier=this.GetUploadHeaderData[i].Supplier;
                //         oEntry.PurchasingOrganization=this.GetUploadHeaderData[i].PurchasingOrganization;
                //         oEntry.PurchasingGroup=this.GetUploadHeaderData[i].PurchasingGroup;
                //         oEntry.to_PurchaseOrderItem = ItemData;

                //         // console.log(oEntry)
                //         // console.log(ItemData)

                //         alert(RefId)
                        
                        
                //         var oModel = this.getOwnerComponent().getModel("API_PURCHASEORDER_PROCESS_SRV");
                //         var that = this;

                // //     setTimeout(function(){

                // //         // try{
                //     return new Promise(function(resolve){
                //             oModel.create("/A_PurchaseOrder", oEntry, {
                //                 method: "POST",
                //                 Accept:"application/json",
                //                 success: function (oData, oResponse) {
                //                     console.log(oResponse)
                //                     alert("SUccess"+ RefId)
                                    
                //                     // that.JObj = {"Id": oData.PurchaseOrder, "PurchasingDocument": oData.Supplier, "Status":"S", "CreatedAt":dd + '-' + mm + '-' + yyyy, "refId": RefId}
                //                     that.JObj = {"refId": RefId, "Status":"S"}
                //                     that.JArray.push(that.JObj)
                                    
                //                     var oJSONModel = new sap.ui.model.json.JSONModel({
                //                         data: that.JArray
                //                     });
                //                     that.getView().setModel(oJSONModel, "JModel");

                //                     oModel.refresh(true);
                                    
                //                     resolve(oData)
                                    
    
                //         },
                //         error: function(error) {
                //                 alert("error", RefId)                            
                //             console.error("Not Uploaded", RefId);
                //             that.JObj = {"refId": RefId, "Status":"R"}
                //                     that.JArray.push(that.JObj)
                                    
                //                     // var oJSONModel = new sap.ui.model.json.JSONModel({
                //                     //     data: that.JArray
                //                     // });
                //                     // that.getView().setModel(oJSONModel, "JModel");
                
                            
                //         }
                //     });

                // });

                // // }, 5000) 

                //     } 

                //     sap.ui.core.BusyIndicator.hide()
                // },
                                
               
                                
                CloseFragment:function(){
                    this.oFilterFrag.destroy();
                    this.oFilterFrag = undefined;

                    // sap.ui.core.BusyIndicator.show()
                },
               
                                
                handleTempDownloadPress: function () {
                    

                     // Your file content
            var fileContent = "Hello, World!";

            // Create a Blob from the file content
            var blob = new Blob([fileContent], { type: "text/plain" });

            // Create a download link
            var a = document.createElement("a");
            var url = window.URL.createObjectURL(blob);

            // Set the download attribute and trigger the click event
            a.href = url;
            a.download = "example.xlsx";
            document.body.appendChild(a);
            a.click();

            // Clean up
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
                    // var Ref_Data01 = "0";
                    // var TableHeaderData;
              
                    // if (Ref_Data01 === "0") {
                    //   TableHeaderData = ["Status", "Document No", "Purchasing Document No", "Material Code", "Material Description", "Quantity", "UOM", "Net Price", "Plant", "Vendor Code", "Vendor Name", "Invoice No", "Invoice Date", "Created At", "Created By", "Changed At", "Changed By"];
                    // } else if (Ref_Data01 === "1") {
                    //   TableHeaderData = ["Document No", "Material Description", "Quantity", "Amount", "Bill No", "Vendor Name", "Created At", "Created By", "Changed At", "Changed By"];
                    // } else if (Ref_Data01 === "2") {
                    //   TableHeaderData = ["Document No", "Sales Order Item", "Sales Order", "Material Code", "Material Description", "Quantity", "Plant", "Customer Code", "Customer Name", "Created At", "Created By", "Changed At", "Changed By"];
                    // }
              
                    // var headerData = [TableHeaderData];
              
                    // // Create a worksheet
                    // var ws = XLSX.utils.aoa_to_sheet(headerData);
              
                    // // Create a workbook
                    // var wb = XLSX.utils.book_new();
                    // XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
              
                    // // Create a blob from the workbook
                    // var blob = XLSX.write(wb, { bookType: 'xlsx', mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
              
                    // // Create a download link
                    // var link = document.createElement('a');
                    // link.href = URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
                    // link.download = 'exported_data.xlsx';
              
                    // // Append the link to the document and trigger the download
                    // document.body.appendChild(link);
                    // link.click();
                    // document.body.removeChild(link);
                }
        });
    });
