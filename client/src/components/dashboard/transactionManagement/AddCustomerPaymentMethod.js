import React, { useEffect, useState } from "react";
import axios from "axios";
import Cards from "react-credit-cards";
import "react-credit-cards/es/styles-compiled.css";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
export default function AddCustomerPayment() {
  const [number, setCardNumber] = useState("");
  const [name, setHolderName] = useState();
  const [expiry, setExpiryDate] = useState("");
  const [cvc, setCVC] = useState("");
  const [focus, setFocus] = useState("");
  const [customer_id, setCusID] = useState("");

  const [userNameERR, setuserNameERR] = useState({});
  const [cardNumberERR, setCardNumberERR] = useState({});
  const [cvcNumberERR, setCvcNumberERR] = useState({});
  const [expireDateERR, setExpireERR] = useState({});
  const [expireDateERR2, setExpireERR2] = useState({});
  const [csrfToken, setCsrfToken] = useState("");
  const [user, setUser] = useState(() => {
    // getting stored value
    const saved = localStorage.getItem("user");
    const initialValue = JSON.parse(saved);
    return initialValue || "";
  });

  useEffect(() => {
    console.log("Fetching CSRF token...");
    fetch("/api/csrf-token", {
      method: "GET",
      credentials: "include",
    })
      .then((res) => {
        console.log("CSRF token response:", res);
        return res.json();
      })
      .then((data) => {
        console.log("CSRF token data:", data);
        setCsrfToken(data.csrfToken);
        localStorage.setItem("csrfToken", data.csrfToken);
      })
      .catch((err) => console.error("Error fetching CSRF token:", err));
  }, []);
  useEffect(() => {
    setCusID(user.id);
  });
  function isEmpty(txt) {
    if (txt.length === 0) {
      return true;
    } else {
      return false;
    }
  }
  //setCusID(user.id);
  //form validation
  const formValidation = () => {
    const cardNumberERR = {};
    const cvcNumberERR = {};
    const expireDateERR = {};
    const expireDateERR2 = {};
    const userNameERR = {};
    let isValid = true;
    var userName = name;
    if (cvc.trim().length < 3) {
      cvcNumberERR.cvcShort = "Invalid CVC Number!";
      isValid = false;
    }
    if (cvc.trim().length > 3) {
      cvcNumberERR.cvcShort = "Invalid CVC Number!";
      isValid = false;
    }

    if (isNaN(cvc)) {
      cvcNumberERR.cvcShort = "Invalid CVC Number!";
      isValid = false;
    }

    if (cvc.trim().length == 0) {
      cvcNumberERR.cvcShort = "Please Enter the CVC number!";
      isValid = false;
    }

    if (number.toString().length < 16) {
      cardNumberERR.numberShort = "Invalid Card Number!";
      isValid = false;
    }

    if (isNaN(number)) {
      cardNumberERR.numberShort = "Invalid Card Number!";
      isValid = false;
    }

    if (number.toString().length == 0) {
      cardNumberERR.numberShort = "Please Enter Card Number!";
      isValid = false;
    }

    if (isEmpty(name)) {
      userNameERR.numberShort = "Please Enter User Name!";
      isValid = false;
    }

    const ex1 = String(expiry).slice(0, 2);
    const ex2 = String(expiry).slice(3, 6);
    const ex3 = String(expiry).slice(2, 3);
    const month = Number(ex1);
    const year = Number(ex2);
    const currentYear = String(new Date().getFullYear()).slice(2, 4);
    const currentMonth = parseInt(new Date().getMonth() + 1);
    const chkYR = parseInt(currentYear);

    if (month > 12) {
      expireDateERR.expireShort = "Invalid Expire Date!";
      isValid = false;
    }

    if (ex3 != "/") {
      expireDateERR.expireShort = "Invalid Expire Date!";
      isValid = false;
    }

    if (isEmpty(expiry)) {
      expireDateERR.expireShort = "Please Enter the expire date!";
      isValid = false;
    }
    if (expiry.length != 0) {
      if (month <= 12) {
        if (ex3 == "/") {
          if (year < chkYR) {
            expireDateERR2.expireShort =
              "Card is Expired! please check your card";
            isValid = false;
          }
          if (year == chkYR) {
            if (month <= currentMonth) {
              expireDateERR2.expireShort =
                "Card is Expired! please check your card";
              isValid = false;
            }
          }
        }
      }
    }

    console.log();

    setCvcNumberERR(cvcNumberERR);
    setCardNumberERR(cardNumberERR);
    setExpireERR(expireDateERR);
    setExpireERR2(expireDateERR2);
    setuserNameERR(userNameERR); //
    return isValid;
  };

  const sendDataToAPI = async (e) => {
    e.preventDefault();
    const isValid = formValidation();
    if (isValid) {
      const res = await fetch("/api/v3/payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": localStorage.getItem("csrfToken"),
        },
        body: JSON.stringify({
          number,
          name,
          expiry,
          cvc,
          customer_id,
        }),
      });

      if (res.status === 200) {
        toast.success("Payment Added Successfully");
        window.location = "/account";
      }
    }
  };
  return (
    <section
      class="section"
      style={{ marginTop: "2%", marginLeft: "35%", marginBottom: "10%" }}
    >
      <div class="row">
        <div class="col-lg-6">
          <div class="card">
            <div class="card-body">
              <div style={{ marginBottom: "-40%" }}>
                <Cards
                  cvc={cvc}
                  expiry={expiry}
                  focused={focus}
                  name={name}
                  number={number}
                />
              </div>
              <h5
                className="card-title"
                style={{ marginTop: "50%", marginBottom: "4%" }}
              >
                Payment details
              </h5>
              <form>
                <div className="col-md-12">
                  <div className="form-floating" style={{ marginBottom: "4%" }}>
                    <input
                      type="tel"
                      className="form-control"
                      val={number}
                      onChange={(e) => setCardNumber(e.target.value)}
                      maxlength="16"
                      onFocus={(e) => setFocus(e.target.name)}
                      name="number"
                      placeholder="Enter the Card Number"
                    />
                    <label htmlFor="rawMaterial" className="form-label">
                      {Object.keys(cardNumberERR).map((key) => {
                        return (
                          <div style={{ color: "red" }}>
                            {cardNumberERR[key]}
                          </div>
                        );
                      })}{" "}
                    </label>
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="form-floating" style={{ marginBottom: "4%" }}>
                    <input
                      type="tel"
                      className="form-control"
                      val={name}
                      onChange={(e) => setHolderName(e.target.value)}
                      maxlength="17"
                      name="name"
                      onFocus={(e) => setFocus(e.target.name)}
                      placeholder="Enter the Card Holder's Name"
                    />
                    <label htmlFor="rawMaterial" className="form-label">
                      {Object.keys(userNameERR).map((key) => {
                        return (
                          <div style={{ color: "red" }}>{userNameERR[key]}</div>
                        );
                      })}
                    </label>
                  </div>
                </div>
                <div className="col-md-5">
                  <div
                    className="form-floating"
                    style={{ marginBottom: "10%" }}
                  >
                    <input
                      type="tel"
                      className="form-control"
                      val={expiry}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      maxlength="5"
                      name="expiry"
                      onFocus={(e) => setFocus(e.target.name)}
                      placeholder="Expire Data (MM/YY)"
                    />
                  </div>
                </div>{" "}
                <label htmlFor="rawMaterial" className="form-label">
                  {Object.keys(expireDateERR).map((key) => {
                    return (
                      <div style={{ color: "red" }}>{expireDateERR[key]}</div>
                    );
                  })}
                  {Object.keys(expireDateERR2).map((key) => {
                    return (
                      <div style={{ color: "red" }}>{expireDateERR2[key]}</div>
                    );
                  })}{" "}
                </label>
                <div className="col-md-4"></div>
                <div className="col-md-3">
                  <div className="form-floating" style={{ marginBottom: "4%" }}>
                    <input
                      type="tel"
                      className="form-control"
                      val={cvc}
                      onChange={(e) => setCVC(e.target.value)}
                      maxlength="3"
                      name="cvc"
                      onFocus={(e) => setFocus(e.target.name)}
                      placeholder="CVC"
                    />
                    <br />
                  </div>
                </div>{" "}
                <label htmlFor="rawMaterial" className="form-label">
                  {Object.keys(cvcNumberERR).map((key) => {
                    return (
                      <div style={{ color: "red" }}>{cvcNumberERR[key]}</div>
                    );
                  })}{" "}
                </label>
                <div className="text-center">
                  <button
                    type="submit"
                    class="btn theme-btn-1 btn-effect-1 text-uppercase"
                    onClick={(e) => sendDataToAPI(e)}
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
