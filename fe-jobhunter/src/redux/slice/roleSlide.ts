import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { callFetchRole } from '@/config/api';
import { IRole } from '@/types/backend';

interface IState {
    isFetching: boolean;
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    },
    result: IRole[]
}

export const fetchRole = createAsyncThunk(
    'role/fetchRole',
    async ({ query }: { query: string }) => {
        const response = await callFetchRole(query);
        return response;
    }
)

const initialState: IState = {
    isFetching: true,
    meta: {
        page: 1,
        pageSize: 10,
        pages: 0,
        total: 0
    },
    result: []
};

export const roleSlide = createSlice({
    name: 'role',
    initialState,
    reducers: {
        setActiveMenu: (state, action) => {
        },
    },
    extraReducers: (builder) => {
        builder.addCase(fetchRole.pending, (state, action) => {
            state.isFetching = true;
        })

        builder.addCase(fetchRole.rejected, (state, action) => {
            state.isFetching = false;
        })

        builder.addCase(fetchRole.fulfilled, (state, action) => {
            if (action.payload && action.payload.data) {
                state.isFetching = false;
                state.meta = action.payload.data.meta;
                state.result = action.payload.data.result;
            }
        })
    },

});

export const {
    setActiveMenu,
} = roleSlide.actions;

export default roleSlide.reducer;
