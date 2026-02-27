import { PhotoCreate, PhotoUpdate, UserCreate, UserUpdate } from "../typings";

export const BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.kevinjobs.com"
    : "http://localhost:3000";

export const genSrc = (str?: string) => {
  return `${BASE_URL}${str}`;
};

const _fetch = async (url: string, options: RequestInit = {}) => {
  const resp = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")?.replaceAll('"', "")}`,
    },
  });
  return resp;
};

//
// 以下是图片相关的 API
//

export const createPhoto = async (photo: PhotoCreate) => {
  const response = await _fetch(`${BASE_URL}/photo`, {
    method: "POST",
    body: JSON.stringify(photo),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`添加图片失败 [ ${error.error} ]`);
  }

  return await response.json();
};

export const getPhotoLists = async (params?: {
  isSelected?: boolean;
  offset?: number;
  limit?: number;
  orderBy?: string;
  order?: string;
  isPublic?: boolean;
}) => {
  const p: Record<string, string> = {
    offset: params?.offset?.toString() || "0",
    limit: params?.limit?.toString() || "10",
    orderBy: params?.orderBy || "shootTime",
    order: params?.order || "desc",
  };

  if (params?.isSelected !== undefined) {
    p["isSelected"] = params.isSelected.toString();
  }

  if (params?.isPublic !== undefined) {
    p["isPublic"] = params.isPublic.toString();
  }

  const query = new URLSearchParams(p);

  const response = await _fetch(`${BASE_URL}/photo/lists?${query}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`获取图片列表失败: [ ${error.error} ]`);
  }

  return await response.json();
};

export const getPhotoByUid = async (uid: string) => {
  const response = await _fetch(`${BASE_URL}/photo?uid=${uid}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`获取图片失败 [ ${error.error} ]`);
  }

  return await response.json();
};

export const updatePhoto = async (uid: string, photo: PhotoUpdate) => {
  const response = await _fetch(`${BASE_URL}/photo?uid=${uid}`, {
    method: "PUT",
    body: JSON.stringify(photo),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`更新图片失败 [ ${error.error} ]`);
  }

  return await response.json();
};

export const deletePhotoByUid = async (uid: string) => {
  const response = await _fetch(`${BASE_URL}/photo?uid=${uid}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`删除图片失败 [ ${error.error} ]`);
  }

  return await response.json();
};

/**
 * 上传图片文件
 * @param file 图片文件
 * @returns 传回的信息
 */
export const uploadPhoto = async (file: File): Promise<{ src: string }> => {
  const form = new FormData();
  form.append("image", file);

  const response = await fetch(`${BASE_URL}/photo/upload`, {
    method: "POST",
    body: form,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")?.replaceAll('"', "")}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`上传图片失败 [ ${error.error} ]`);
  }

  return await response.json();
};

//
// 以下是地址相关的 API
//

interface AddressResponse {
  status: string;
  regeocode: {
    addressComponent: {
      city: string;
      province: string;
      adcode: string;
      district: string;
      towncode: string;
      streetNumber: {
        number: string[];
        direction: string[];
        distance: string[];
        street: string[];
      };
      country: string;
      township: string;
      businessAreas: string[][];
      building: {
        name: string[];
        type: string[];
      };
      neighborhood: {
        name: string[];
        type: string[];
      };
      citycode: string;
    };
    formatted_address: string;
  };
  info: string;
  infocode: string;
}

export const getAddress = async (
  longitude: string,
  latitude: string,
): Promise<AddressResponse> => {
  const baseUrl = "https://restapi.amap.com/v3/geocode/regeo";
  // 这是一个免费的无限制的key
  const key = "be262c006216c542747fce766130cee3";
  const url = `${baseUrl}?location=${longitude},${latitude}&key=${key}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`无法从高德API获取地址: ${response.statusText}`);
  }

  return response.json();
};

//
// 以下是用户相关的 API
//

export const getUserLists = async () => {
  const response = await _fetch(`${BASE_URL}/user/lists`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`无法获取用户列表: [ ${error.error} ]`);
  }

  return await response.json();
};

export const updateUser = async (id: string, user: UserUpdate) => {
  const response = await _fetch(`${BASE_URL}/user?uid=${id}`, {
    method: "PUT",
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`更新用户失败 [ ${error.error} ]`);
  }

  return await response.json();
};

export const createUser = async (user: UserCreate) => {
  const response = await _fetch(`${BASE_URL}/user`, {
    method: "POST",
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`创建用户失败 [ ${error.error} ]`);
  }

  const data = await response.json();
  return data;
};

export const registerUser = async (
  email: string,
  password: string,
  verifyCode: string,
) => {
  const response = await _fetch(`${BASE_URL}/user/register`, {
    method: "POST",
    body: JSON.stringify({ email, password, verifyCode }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`注册用户失败 [ ${error.error} ]`);
  }

  return await response.json();
};

//
// 以下是认证相关的 API
//

export const sendVerifyCode = async (email: string) => {
  const response = await _fetch(
    `${BASE_URL}/auth/send-verify-code?email=${email}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`获取验证码失败 [ ${error.error} ]`);
  }

  return await response.json();
};

export const signToken = async (email: string, password: string) => {
  const response = await _fetch(`${BASE_URL}/auth/sign-token`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`获取 token 失败 [ ${error.error} ]`);
  }

  return await response.json();
};

export const verifyToken = async (token: string) => {
  const response = await _fetch(`${BASE_URL}/auth/verify-token`, {
    method: "POST",
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`验证 token 失败 [ ${error.error} ]`);
  }

  return await response.json();
};
