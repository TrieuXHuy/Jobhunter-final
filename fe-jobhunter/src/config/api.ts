import { IBackendRes, ICompany, IAccount, IUser, IModelPaginate, IGetAccount, IJob, IResume, IResumeByUser, ISkill, IPermission, IRole, ISubscriber } from '@/types/backend';
import axios from 'config/axios-customize';

interface IUserUpsertPayload {
    id?: string;
    name: string;
    email: string;
    password?: string;
    age: number;
    gender: string;
    address: string;
    role?: string | { id: string | number };
    company?: { id: string | number };
}

/**
 * 
Module Auth
 */
export const callRegister = (name: string, email: string, password: string, age: number, gender: string, address: string) => {
    const normalizedGender = gender?.toUpperCase();
    return axios.post<IBackendRes<IUser>>('/api/v1/auth/register', {
        name,
        email,
        password,
        age,
        gender: normalizedGender,
        address
    })
}

export const callLogin = (username: string, password: string) => {
    return axios.post<IBackendRes<IAccount>>('/api/v1/auth/login', { username, password })
}

export const callFetchAccount = () => {
    return axios.get<IBackendRes<IGetAccount>>('/api/v1/auth/account')
}

export const callRefreshToken = () => {
    return axios.get<IBackendRes<IAccount>>('/api/v1/auth/refresh')
}

export const callLogout = () => {
    return axios.post<IBackendRes<string>>('/api/v1/auth/logout')
}

/**
 * Upload single file
 */
export const callUploadSingleFile = (file: any, folderType: string) => {
    const sanitizeFileName = (name: string) => {
        const dotIndex = name.lastIndexOf('.');
        const hasExtension = dotIndex > 0;
        const baseName = hasExtension ? name.substring(0, dotIndex) : name;
        const extension = hasExtension ? name.substring(dotIndex) : '';

        const safeBaseName = baseName
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9-_]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_+|_+$/g, '');

        return `${safeBaseName || 'file'}${extension}`;
    };

    const sanitizedFile =
        file instanceof File
            ? new File([file], sanitizeFileName(file.name), {
                type: file.type,
                lastModified: file.lastModified,
            })
            : file;

    const bodyFormData = new FormData();
    bodyFormData.append('file', sanitizedFile);
    bodyFormData.append('folder', folderType);

    return axios<IBackendRes<{ fileName: string }>>({
        method: 'post',
        url: '/api/v1/files',
        data: bodyFormData,
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
}




/**
 * 
Module Company
 */
export const callCreateCompany = (name: string, address: string, description: string, logo: string) => {
    return axios.post<IBackendRes<ICompany>>('/api/v1/companies', { name, address, description, logo })
}

export const callUpdateCompany = (id: string, name: string, address: string, description: string, logo: string) => {
    return axios.put<IBackendRes<ICompany>>(`/api/v1/companies`, { id, name, address, description, logo })
}

export const callDeleteCompany = (id: string) => {
    return axios.delete<IBackendRes<ICompany>>(`/api/v1/companies/${id}`);
}

export const callFetchCompany = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<ICompany>>>(`/api/v1/companies?${query}`);
}

export const callFetchCompanyById = (id: string) => {
    return axios.get<IBackendRes<ICompany>>(`/api/v1/companies/${id}`);
}

/**
 * 
Module Skill
 */
export const callCreateSkill = (name: string) => {
    return axios.post<IBackendRes<ISkill>>('/api/v1/skills', { name })
}

export const callUpdateSkill = (id: string, name: string) => {
    return axios.put<IBackendRes<ISkill>>(`/api/v1/skills`, { id, name })
}

export const callDeleteSkill = (id: string) => {
    return axios.delete<IBackendRes<ISkill>>(`/api/v1/skills/${id}`);
}

export const callFetchAllSkill = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<ISkill>>>(`/api/v1/skills?${query}`);
}



/**
 * 
Module User
 */
export const callCreateUser = (user: IUserUpsertPayload) => {
    return axios.post<IBackendRes<IUser>>('/api/v1/users', { ...user })
}

export const callUpdateUser = (user: IUserUpsertPayload) => {
    return axios.put<IBackendRes<IUser>>(`/api/v1/users`, { ...user })
}

export const callDeleteUser = (id: string) => {
    return axios.delete<IBackendRes<IUser>>(`/api/v1/users/${id}`);
}

export const callFetchUser = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IUser>>>(`/api/v1/users?${query}`);
}

export const callFetchUserById = (id: string | number) => {
    return axios.get<IBackendRes<IUser>>(`/api/v1/users/${id}`);
}

/**
 * 
Module Job
 */
export const callCreateJob = (job: IJob) => {
    return axios.post<IBackendRes<IJob>>('/api/v1/jobs', { ...job })
}

export const callUpdateJob = (job: IJob, id: string) => {
    return axios.put<IBackendRes<IJob>>(`/api/v1/jobs`, { id, ...job })
}

export const callDeleteJob = (id: string) => {
    return axios.delete<IBackendRes<IJob>>(`/api/v1/jobs/${id}`);
}

export const callFetchJob = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IJob>>>(`/api/v1/jobs?${query}`);
}

export const callFetchJobById = (id: string) => {
    return axios.get<IBackendRes<IJob>>(`/api/v1/jobs/${id}`);
}

/**
 * 
Module Resume
 */
export const callCreateResume = (url: string, jobId: any, email: string, userId: string | number) => {
    return axios.post<IBackendRes<IResume>>('/api/v1/resumes', {
        email, url,
        status: "PENDING",
        user: {
            "id": userId
        },
        job: {
            "id": jobId
        }
    })
}

export const callUpdateResumeStatus = (id: any, status: string) => {
    return axios.put<IBackendRes<IResume>>(`/api/v1/resumes`, { id, status })
}

export const callDeleteResume = (id: string) => {
    return axios.delete<IBackendRes<IResume>>(`/api/v1/resumes/${id}`);
}

export const callFetchResume = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IResume>>>(`/api/v1/resumes?${query}`);
}

export const callFetchResumeById = (id: string) => {
    return axios.get<IBackendRes<IResume>>(`/api/v1/resumes/${id}`);
}

export const callFetchResumeByUser = (query: string) => {
    return axios.post<IBackendRes<IModelPaginate<IResumeByUser>>>(`/api/v1/resumes/by-user?${query}`);
}

/**
 *
Module Subscriber
 */
export const callFetchSubscriberSkills = () => {
    return axios.post<IBackendRes<ISubscriber>>('/api/v1/subscribers/skills');
}

export const callCreateSubscriber = (subscriber: ISubscriber) => {
    return axios.post<IBackendRes<ISubscriber>>('/api/v1/subscribers', { ...subscriber });
}

export const callUpdateSubscriber = (subscriber: ISubscriber) => {
    return axios.put<IBackendRes<ISubscriber>>('/api/v1/subscribers', { ...subscriber });
}

/**
 *
Module Permission
 */
export const callCreatePermission = (permission: IPermission) => {
    return axios.post<IBackendRes<IPermission>>('/api/v1/permissions', { ...permission })
}

export const callUpdatePermission = (permission: IPermission) => {
    return axios.put<IBackendRes<IPermission>>(`/api/v1/permissions`, { ...permission })
}

export const callDeletePermission = (id: string | number) => {
    return axios.delete<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`);
}

export const callFetchPermission = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IPermission>>>(`/api/v1/permissions?${query}`);
}

/**
 *
Module Role
 */
export const callCreateRole = (role: IRole) => {
    return axios.post<IBackendRes<IRole>>('/api/v1/roles', { ...role })
}

export const callUpdateRole = (role: IRole) => {
    return axios.put<IBackendRes<IRole>>(`/api/v1/roles`, { ...role })
}

export const callDeleteRole = (id: string | number) => {
    return axios.delete<IBackendRes<IRole>>(`/api/v1/roles/${id}`);
}

export const callFetchRole = (query: string) => {
    return axios.get<IBackendRes<IModelPaginate<IRole>>>(`/api/v1/roles?${query}`);
}

export const callFetchRoleById = (id: string | number) => {
    return axios.get<IBackendRes<IRole>>(`/api/v1/roles/${id}`);
}
