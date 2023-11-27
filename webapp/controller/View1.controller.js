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

                },
        
                _onRouteMatched: function(oEvent){
                  
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
                
                    let SuccessCount = 0;
                    let ErrorCount = 0;
                
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
                
                                that.JObj = { "refId": RefId, "Id": oData.PurchaseOrder,"createdate" :oData.CreationDate , "createuser":oData.CreatedByUser, "Status": "Success", "Color":"Success" };
                                that.JArray.push(that.JObj);
                
                                var oJSONModel = new sap.ui.model.json.JSONModel({
                                    data: that.JArray
                                });
                                that.getView().setModel(oJSONModel, "JModel");
                
                                oModel.refresh(true);
                                let SUccessCount = that.getView().byId("SuccessCount").getNumber();
                                that.getView().byId("SuccessCount").setNumber(parseInt(SUccessCount) + 1)

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

                                let ERorrCount = that.getView().byId("ErrorCount").getNumber();
                                that.getView().byId("ErrorCount").setNumber(parseInt(ERorrCount) + 1)
                
                                oModel.refresh(true);
                                resolve("oData");
                            }
                        });
                    });
                },
                

                                
                CloseFragment:function(){
                    this.oFilterFrag.destroy();
                    this.oFilterFrag = undefined;

                    // sap.ui.core.BusyIndicator.show()
                },
               
                                

        });
    });
