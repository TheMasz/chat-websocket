import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const Signup = () => {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cfPassword, setCfPassword] = useState("");

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const submitHandler = () => {
    register(email, password, cfPassword);
  };
  return (
    <div className="container mx-auto ">
      <div className="min-h-screen flex items-center">
        <div className="w-1/2">
          <img src="/comunity-1.png" alt="comunity-img" />
        </div>
        <div className="w-1/2 p-8">
          <h1 className="text-2xl font-bold ">Signup</h1>
          <p className="mb-4 text-sky-400">Join to chat and connect.</p>
          <div className="input-wrap">
            <input
              type="text"
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="input-wrap">
            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="input-wrap">
            <input
              type="password"
              placeholder="Confirm Password"
              onChange={(e) => setCfPassword(e.target.value)}
            />
          </div>
          <p className="mb-4">
            If you already have an account?{" "}
            <span className="text-sky-500 underline">
              <Link to="/signin">Signin</Link>
            </span>
          </p>
          <div className="flex justify-end">
            <button
              className=" alig py-2 px-6 bg-sky-500 text-white font-medium rounded-xl hover:bg-sky-600"
              onClick={submitHandler}
            >
              register
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
