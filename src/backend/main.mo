import Order "mo:core/Order";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Runtime "mo:core/Runtime";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Float "mo:core/Float";
import Array "mo:core/Array";
import Iter "mo:core/Iter";

actor {
  type Product = {
    id : Nat;
    name : Text;
    category : Text;
    unit : Text;
    buyingPrice : Float;
    sellingPrice : Float;
    stockQty : Nat;
    minStockQty : Nat;
  };

  type BillItem = {
    productId : Nat;
    productName : Text;
    qty : Nat;
    sellingPrice : Float;
    buyingPrice : Float;
  };

  type Bill = {
    billNumber : Nat;
    customerName : Text;
    date : Time.Time;
    items : [BillItem];
    totalAmount : Float;
  };

  type Purchase = {
    supplierName : Text;
    productId : Nat;
    productName : Text;
    quantity : Nat;
    buyingPrice : Float;
    date : Time.Time;
  };

  type PaymentRecord = {
    date : Time.Time;
    amount : Float;
    note : Text;
  };

  type CreditCustomer = {
    name : Text;
    phone : Text;
    totalOwed : Float;
    dateCreated : Time.Time;
    payments : [PaymentRecord];
  };

  type DashboardSummary = {
    todaysSales : Float;
    inventoryValue : Float;
    outstandingLoans : Float;
    lowStockCount : Nat;
    totalProducts : Nat;
  };

  module CreditCustomer {
    public func compare(customer1 : CreditCustomer, customer2 : CreditCustomer) : Order.Order {
      Text.compare(customer1.name, customer2.name);
    };

    public func compareByAmount(customer1 : CreditCustomer, customer2 : CreditCustomer) : Order.Order {
      Float.compare(customer1.totalOwed, customer2.totalOwed);
    };
  };

  var nextProductId = 1;
  var nextBillNumber = 1;

  let products = Map.empty<Nat, Product>();
  let bills = Map.empty<Nat, Bill>();
  let purchases = Map.empty<Nat, Purchase>();
  let creditCustomers = Map.empty<Text, CreditCustomer>();

  // Product CRUD
  public shared ({ caller }) func addProduct(product : Product) : async Nat {
    let id = nextProductId;
    nextProductId += 1;
    let newProduct : Product = {
      product with
      id;
    };
    products.add(id, newProduct);
    id;
  };

  public shared ({ caller }) func getProduct(id : Nat) : async Product {
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) { product };
    };
  };

  public shared ({ caller }) func updateProduct(product : Product) : async () {
    switch (products.get(product.id)) {
      case (null) { Runtime.trap("Product not found") };
      case (_) {
        products.add(product.id, product);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    products.remove(id);
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    products.values().toArray();
  };

  public query ({ caller }) func getLowStockProducts() : async [Product] {
    products.values().toArray().filter(
      func(p) { p.stockQty <= p.minStockQty }
    );
  };

  // Bills/Sales
  public shared ({ caller }) func addBill(bill : Bill) : async Nat {
    let billNumber = nextBillNumber;
    nextBillNumber += 1;
    let newBill : Bill = {
      bill with
      billNumber;
      date = Time.now();
    };
    bills.add(billNumber, newBill);

    // Deduct stock
    for (item in bill.items.values()) {
      switch (products.get(item.productId)) {
        case (null) { Runtime.trap("Product not found in stock") };
        case (?product) {
          if (product.stockQty < item.qty) {
            Runtime.trap("Insufficient stock for product: " # product.name);
          };
          let updatedProduct : Product = {
            product with
            stockQty = product.stockQty - item.qty;
          };
          products.add(product.id, updatedProduct);
        };
      };
    };
    billNumber;
  };

  public query ({ caller }) func getBill(billNumber : Nat) : async Bill {
    switch (bills.get(billNumber)) {
      case (null) { Runtime.trap("Bill not found") };
      case (?bill) { bill };
    };
  };

  public query ({ caller }) func getAllBills() : async [Bill] {
    bills.values().toArray();
  };

  // Purchases
  public shared ({ caller }) func addPurchase(purchase : Purchase) : async () {
    let id = purchases.size(); // Use size as id
    purchases.add(id, purchase);

    // Increase stock
    switch (products.get(purchase.productId)) {
      case (null) { Runtime.trap("Product not found in stock") };
      case (?product) {
        let updatedProduct : Product = {
          product with
          stockQty = product.stockQty + purchase.quantity;
        };
        products.add(product.id, updatedProduct);
      };
    };
  };

  public query ({ caller }) func getAllPurchases() : async [Purchase] {
    purchases.values().toArray();
  };

  // Customer Credit
  public shared ({ caller }) func addCreditCustomer(customer : CreditCustomer) : async () {
    if (creditCustomers.containsKey(customer.name)) {
      Runtime.trap("Credit customer already exists");
    };
    creditCustomers.add(customer.name, customer);
  };

  public shared ({ caller }) func recordPayment(customerName : Text, amount : Float) : async () {
    switch (creditCustomers.get(customerName)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) {
        let newPayment : PaymentRecord = {
          date = Time.now();
          amount;
          note = "Payment received";
        };
        let updatedPayments = customer.payments.concat([newPayment]);
        let updatedCustomer : CreditCustomer = {
          customer with
          totalOwed = customer.totalOwed - amount;
          payments = updatedPayments;
        };
        creditCustomers.add(customerName, updatedCustomer);
      };
    };
  };

  public query ({ caller }) func getAllCreditCustomers() : async [CreditCustomer] {
    creditCustomers.values().toArray();
  };

  public query ({ caller }) func getOutstandingCreditCustomers() : async [CreditCustomer] {
    creditCustomers.values().toArray().filter(
      func(c) { c.totalOwed > 0.0 }
    );
  };

  // Dashboard Summary
  public query ({ caller }) func getDashboardSummary(startTime : Time.Time, endTime : Time.Time) : async DashboardSummary {
    var todaysSales : Float = 0.0;
    var inventoryValue : Float = 0.0;
    var outstandingLoans : Float = 0.0;
    var lowStockCount = 0;

    for (bill in bills.values()) {
      if (bill.date >= startTime and bill.date <= endTime) {
        todaysSales += bill.totalAmount;
      };
    };

    for (product in products.values()) {
      inventoryValue += product.stockQty.toFloat() * product.sellingPrice;
      if (product.stockQty <= product.minStockQty) {
        lowStockCount += 1;
      };
    };

    for (customer in creditCustomers.values()) {
      outstandingLoans += customer.totalOwed;
    };

    {
      todaysSales;
      inventoryValue;
      outstandingLoans;
      lowStockCount;
      totalProducts = products.size();
    };
  };

  // Helper Functions
  public query ({ caller }) func getAllProductsSorted() : async [Product] {
    products.values().toArray().sort(
      func(a, b) { Text.compare(a.name, b.name) }
    );
  };

  public query ({ caller }) func getAllCreditCustomersSortedByAmount() : async [CreditCustomer] {
    creditCustomers.values().toArray().sort(CreditCustomer.compareByAmount);
  };
};
