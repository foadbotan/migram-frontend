import { Dispatch } from "react";
import { Session } from "next-auth";
import { getSession, signIn as nextAuthSignIn } from "next-auth/react";
import { Stripe } from "@stripe/stripe-js";
import axios from "axios";

import { ACTIONTYPE, State, Statuses } from "./CustomerSignupReducer";

export async function signin(credentials: { email: string; password: string }) {
  await nextAuthSignIn("credentials", {
    ...credentials,
    redirect: false,
    callbackUrl: "/",
  });
}

export const createUser = (
  state: State,
  dispatch: Dispatch<ACTIONTYPE>,
  session: Session | null
) => {
  if (state.status !== Statuses.CREATE_USER) return;
  if (session) return;

  const { name, email, password, passwordConfirm } = state.values;
  const user = { name, email, password, passwordConfirm };
  const credentials = { email, password };

  axios
    .post(`${process.env.NEXT_PUBLIC_API_URL}api/v1/users/signUp`, user)
    .then(async () => {
      await signin(credentials);
      const session = await getSession();

      axios.defaults.headers.common[
        "authorization"
      ] = `Bearer ${session?.accessToken}`;

      dispatch({ type: Statuses.CREATE_CUSTOMER });
    })
    .catch((error: any) => {
      dispatch({
        type: Statuses.REJECTED,
        error: new Error(error.response.data.message),
      });
    });
};

export const createCustomer = (
  state: State,
  dispatch: Dispatch<ACTIONTYPE>,
  session: Session | null,
  stripe: Stripe | null
) => {
  if (state.status !== Statuses.CREATE_CUSTOMER) return;
  if (!session) return;

  const {
    password,
    name,
    email,
    phone,
    description,
    line1,
    line2,
    city,
    postal_code,
  } = state.values;

  const customer = {
    name,
    email,
    phone,
    description,
    shipping: {
      name,
      address: {
        line1,
        line2,
        city,
        state: state.values.state,
        postal_code,
      },
    },
  };

  const credentials = { email, password };
  axios
    .post(`${process.env.NEXT_PUBLIC_API_URL}api/v1/customers/`, customer)
    .then(() => {
      return createSetupIntent(session);
    })
    .then((response) => {
      return confirmStripeCardSetup(response.data.client_secret, stripe);
    })
    .then(async () => {
      await signin(credentials);
      dispatch({ type: Statuses.RESOLVED });
    })
    .catch((error: any) => {
      dispatch({
        type: Statuses.REJECTED,
        error: error,
      });
    });
};

export const createSetupIntent = async (session: Session) => {
  return await axios.post(
    `${process.env.NEXT_PUBLIC_API_URL}api/v1/customers/create-setup-intent`,
    null
  );
};

async function confirmStripeCardSetup(
  client_secret: string,
  stripe: Stripe | null
) {
  if (!stripe) {
    throw new Error("Stripe is not intiialized.");
  }

  const result = await stripe.confirmCardSetup(client_secret, {
    // Add Test Card
    payment_method: { card: { token: "tok_au" } },
  });

  if (result.error) throw result.error;

  return result;
}
