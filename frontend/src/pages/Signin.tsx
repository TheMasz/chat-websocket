import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

const Signin = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const submitHandler = () => {
    if (!emailOrUsername && !password) return;
    login(emailOrUsername, password);
  };

  return (
    <div className="container mx-auto ">
      <div className="min-h-screen flex items-center">
        <div className="w-1/2">
          <img src="/comunity-1.png" alt="comunity-img" />
        </div>
        <div className="w-1/2 p-8">
          <h1 className="text-2xl font-bold ">Signin</h1>
          <p className="mb-4 text-sky-400">Join to chat and connect.</p>
          <div className="input-wrap">
            <input
              type="text"
              placeholder="Email or Username"
              onChange={(e) => setEmailOrUsername(e.target.value)}
            />
          </div>
          <div className="input-wrap">
            <input
              type="password"
              placeholder="Password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <p className="mb-4">
            If you don't have an account?{" "}
            <span className="text-sky-500 underline">
              <Link to="/signup">Signup</Link>
            </span>
          </p>
          <div className="flex justify-end">
            <button
              className=" alig py-2 px-6 bg-sky-500 text-white font-medium rounded-xl hover:bg-sky-600"
              onClick={submitHandler}
            >
              login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signin;
