"use client";
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loadMe } from "../../store/slices/authSlice";
import Cookies from "js-cookie";

export default function AuthLoader() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (!user && Cookies.get("token")) {
      dispatch(loadMe());
    }
  }, [dispatch, user]);

  return null;
}
